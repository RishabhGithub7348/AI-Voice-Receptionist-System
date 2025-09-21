from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, cast, Optional
from uuid import UUID, uuid4

from dotenv import load_dotenv
from google.genai.types import Modality
from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    WorkerType,
    cli,
    llm,
    utils,
)
from livekit.agents.multimodal import MultimodalAgent
from livekit.plugins.google import beta as google

from backend_client import backend_client

load_dotenv(dotenv_path=".env.local")

logger = logging.getLogger("gemini-playground")
logger.setLevel(logging.INFO)

# Custom log handler to capture user transcripts from livekit.agents logs
class TranscriptCaptureHandler(logging.Handler):
    def __init__(self, session_manager_ref):
        super().__init__()
        self.session_manager_ref = session_manager_ref

    def emit(self, record):
        try:
            logger.info(f"🔍 Handler received log: {record.name} - {record.getMessage()}")

            # Look for user speech commits in livekit.agents logs
            if (record.name == "livekit.agents" and
                "committed user speech" in record.getMessage()):

                log_message = record.getMessage()
                logger.info(f"🎯 Captured livekit log: {log_message}")

                # Extract JSON from the log message
                json_match = re.search(r'\{.*\}', log_message)
                if json_match:
                    try:
                        speech_data = json.loads(json_match.group())
                        user_transcript = speech_data.get('user_transcript')

                        logger.info(f"🎯 Raw transcript value: '{user_transcript}'")

                        if user_transcript and user_transcript != "...":
                            logger.info(f"🎯 Extracted user transcript: {user_transcript}")

                            # Update session manager if available
                            if (self.session_manager_ref and
                                hasattr(self.session_manager_ref, 'recent_user_question')):
                                self.session_manager_ref.recent_user_question = user_transcript
                                self.session_manager_ref.last_clear_question = user_transcript
                                logger.info(f"✅ Updated session manager with: {user_transcript}")
                        else:
                            logger.warning(f"⚠️ Received unclear or empty transcript: '{user_transcript}'")

                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse JSON from livekit log: {e}")

        except Exception as e:
            logger.error(f"Error in transcript capture handler: {e}")

# We'll set this up when we create the session manager
transcript_handler = None

# Base salon instructions - will be enhanced with dynamic knowledge base
BASE_SALON_INSTRUCTIONS = """
You are an AI receptionist for Bella's Hair & Beauty Salon, a premium salon in downtown.

IMPORTANT: For any question you're not 100% sure about, respond with:
"Let me check with my supervisor and get back to you shortly."

TONE: Always be friendly, professional, and helpful. Make customers feel welcomed and valued.

If you need to escalate to a supervisor, say exactly: "Let me check with my supervisor and get back to you shortly."
"""

async def get_dynamic_instructions() -> str:
    """Get dynamic instructions including knowledge base"""
    try:
        # Get salon context from backend
        salon_context = await backend_client.get_salon_context()

        # Combine base instructions with dynamic context
        dynamic_instructions = f"{BASE_SALON_INSTRUCTIONS}\n\n{salon_context}"

        logger.info("✅ Loaded dynamic instructions from backend")
        return dynamic_instructions

    except Exception as e:
        logger.warning(f"⚠️ Failed to load dynamic instructions, using base: {e}")
        return BASE_SALON_INSTRUCTIONS

def get_initial_chat_ctx() -> llm.ChatContext:
    """Get initial chat context with base instructions"""
    return llm.ChatContext(
        messages=[
            llm.ChatMessage(
                role="system",
                content=BASE_SALON_INSTRUCTIONS
            ),
            llm.ChatMessage(
                role="user",
                content="Please begin the interaction with the user in a manner consistent with your instructions.",
            )
        ]
    )


@dataclass
class SessionConfig:
    gemini_api_key: str
    instructions: str
    voice: google.realtime.Voice
    temperature: float
    max_response_output_tokens: str | int
    modalities: list[str]
    presence_penalty: float
    frequency_penalty: float

    def __post_init__(self):
        if self.modalities is None:
            self.modalities = self._modalities_from_string("audio_only")

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if k != "gemini_api_key"}

    @staticmethod
    def _modalities_from_string(
        modalities: str,
    ) -> list[str]:
        modalities_map: Dict[str, List[str]] = {
            "text_and_audio": ["TEXT", "AUDIO"],
            "text_only": ["TEXT"],
            "audio_only": ["AUDIO"],
        }
        return modalities_map.get(modalities, modalities_map["audio_only"])

    def __eq__(self, other) -> bool:
        return self.to_dict() == other.to_dict()


def parse_session_config(data: Dict[str, Any]) -> SessionConfig:
    # Use environment variable for Gemini API key
    gemini_key = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY", ""))

    config = SessionConfig(
        gemini_api_key=gemini_key,  # Use backend env variable instead of frontend
        instructions=data.get("instructions", ""),
        voice=data.get("voice", ""),
        temperature=float(data.get("temperature", 0.8)),
        max_response_output_tokens=
            "inf" if data.get("max_output_tokens") == "inf"
            else int(data.get("max_output_tokens") or 2048),
        modalities=SessionConfig._modalities_from_string(
            data.get("modalities", "audio_only")
        ),
        presence_penalty=float(data.get("presence_penalty", 0.0)),
        frequency_penalty=float(data.get("frequency_penalty", 0.0)),
    )
    return config


async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    metadata = json.loads(participant.metadata)
    config = parse_session_config(metadata)
    session_manager = await run_multimodal_agent(ctx, participant, config)  # Now async

    logger.info("agent started")


class SessionManager:
    def __init__(self, config: SessionConfig):
        self.instructions = config.instructions
        self.chat_history: List[llm.ChatMessage] = []
        self.current_agent: MultimodalAgent | None = None
        self.current_model: google.realtime.RealtimeModel | None = None
        self.current_config: SessionConfig = config
        self.call_session_id: Optional[UUID] = None
        self.customer_phone: Optional[str] = None
        self.session_started = False

    async def create_model(self, config: SessionConfig) -> google.realtime.RealtimeModel:
        # Get dynamic instructions from backend
        dynamic_instructions = await get_dynamic_instructions()

        model = google.realtime.RealtimeModel(
            instructions=dynamic_instructions,  # Use dynamic instructions instead of config
            modalities=cast(list[Modality], config.modalities),
            voice=config.voice,
            temperature=config.temperature,
            max_output_tokens=int(config.max_response_output_tokens),
            api_key=config.gemini_api_key,
            enable_user_audio_transcription=True,  # Enable user transcription
            enable_agent_audio_transcription=True,  # Enable AI transcription
        )
        return model

    def create_agent(self, model: google.realtime.RealtimeModel, chat_ctx: llm.ChatContext) -> MultimodalAgent:
        agent = MultimodalAgent(model=model, chat_ctx=chat_ctx)

        # Store recent conversation context for ticket creation
        self.recent_user_question = "Customer inquiry (audio not captured)"
        self.last_clear_question = None  # Store the last clearly understood question

        return agent

    async def setup_session(self, ctx: JobContext, participant: rtc.RemoteParticipant, chat_ctx: llm.ChatContext):
        room = ctx.room
        self.current_model = await self.create_model(self.current_config)  # Now async
        self.current_agent = self.create_agent(self.current_model, chat_ctx)

        # Create call session on first setup
        if not self.session_started:
            self.call_session_id = uuid4()
            self.customer_phone = participant.identity
            self.session_started = True
            logger.info(f"Created call session: {self.call_session_id} for customer: {self.customer_phone}")

        self.current_agent.start(room, participant)
        self.current_agent.generate_reply("cancel_existing")

        # Hook into LiveKit agent events for escalation detection
        self._setup_livekit_event_handlers(self.current_agent)

        @ctx.room.local_participant.register_rpc_method("pg.updateConfig")
        async def update_config(data: rtc.rpc.RpcInvocationData):
            if self.current_agent is None or self.current_model is None or data.caller_identity != participant.identity:
                return json.dumps({"changed": False})

            new_config = parse_session_config(json.loads(data.payload))
            if self.current_config != new_config:
                logger.info(
                    f"config changed: {new_config.to_dict()}, participant: {participant.identity}"
                )

                self.current_config = new_config
                session = self.current_model.sessions[0]
                model = await self.create_model(new_config)  # Now async
                agent = self.create_agent(model, session.chat_ctx_copy())
                await self.replace_session(ctx, participant, agent, model)
                return json.dumps({"changed": True})
            else:
                return json.dumps({"changed": False})


    @utils.log_exceptions(logger=logger)
    async def end_session(self):
        if self.current_agent is None or self.current_model is None:
            return

        await utils.aio.gracefully_cancel(self.current_model.sessions[0]._main_atask)
        self.current_agent = None
        self.current_model = None

    @utils.log_exceptions(logger=logger)
    async def replace_session(self, ctx: JobContext, participant: rtc.RemoteParticipant, agent: MultimodalAgent, model: google.realtime.RealtimeModel):
        await self.end_session()

        self.current_agent = agent
        self.current_model = model
        agent.start(ctx.room, participant)
        agent.generate_reply("cancel_existing")

        session = self.current_model.sessions[0]

        chat_history = session.chat_ctx_copy()
        # Patch: remove the empty conversation items
        # https://github.com/livekit/agents/pull/1245
        chat_history.messages = [
            msg
            for msg in chat_history.messages
            if msg.tool_call_id or msg.content is not None
        ]
        # session._remote_conversation_items = _RemoteConversationItems()

        # create a new connection
        session._main_atask = asyncio.create_task(session._main_task())
        # session.session_update()

        chat_history.append(
            text="We've just been reconnected, please continue the conversation.",
            role="assistant",
        )
        await session.set_chat_ctx(chat_history)

    async def process_customer_query(self, question: str, participant: rtc.RemoteParticipant) -> Optional[str]:
        """
        Process customer query through backend for intelligent handling
        """
        try:
            # Extract customer phone from participant metadata if available
            customer_phone = "unknown"
            customer_name = None

            if hasattr(participant, 'metadata') and participant.metadata:
                metadata = json.loads(participant.metadata)
                customer_phone = metadata.get('customer_phone', participant.identity)
                customer_name = metadata.get('customer_name')

            # Send query to backend for processing
            result = await backend_client.process_query(
                question=question,
                customer_phone=customer_phone,
                customer_name=customer_name,
                call_session_id=self.call_session_id,
                context=self._get_conversation_context()
            )

            if result.get("has_answer"):
                logger.info(f"Backend provided answer with confidence {result.get('confidence', 0)}")
                return result.get("answer")
            else:
                logger.info(f"Backend escalated query, help_request_id: {result.get('help_request_id')}")
                return result.get("answer", "Let me check with my supervisor and get back to you shortly.")

        except Exception as e:
            logger.error(f"Error processing customer query: {e}")
            return "I'm experiencing some technical difficulties. Let me get someone to help you right away."

    def _get_conversation_context(self) -> str:
        """Get recent conversation context for backend processing"""
        if not self.chat_history:
            return ""

        # Get last few messages for context
        recent_messages = self.chat_history[-5:] if len(self.chat_history) > 5 else self.chat_history
        context_parts = []

        for msg in recent_messages:
            role = "Customer" if msg.role == "user" else "AI"
            content = msg.content if isinstance(msg.content, str) else str(msg.content)
            context_parts.append(f"{role}: {content}")

        return "\n".join(context_parts)

    def set_customer_info(self, phone: str, call_session_id: UUID):
        """Set customer information for this session"""
        self.customer_phone = phone
        self.call_session_id = call_session_id

    def _setup_livekit_event_handlers(self, agent: MultimodalAgent):
        """Set up LiveKit agent event handlers for escalation detection"""
        try:
            # Hook into agent speech events
            @agent.on("agent_speech_committed")
            def on_agent_speech(speech_event):
                """Handle agent speech events to detect escalation"""
                async def process_agent_speech():
                    try:
                        # Handle different speech event formats
                        if isinstance(speech_event, str):
                            agent_text = speech_event
                        elif hasattr(speech_event, 'alternatives') and speech_event.alternatives:
                            agent_text = speech_event.alternatives[0].text
                        elif hasattr(speech_event, 'text'):
                            agent_text = speech_event.text
                        else:
                            agent_text = str(speech_event)

                        logger.info(f"🤖 AI said: {agent_text}")

                        # Check if this is an escalation response
                        if self._is_escalation_response(agent_text):
                            logger.info(f"🚨 ESCALATION DETECTED: {agent_text}")

                            # Only create ticket if we have a clear question that needs answering
                            question_for_ticket = None

                            if self.recent_user_question == "Speech unclear - please repeat":
                                # Don't create tickets for speech recognition failures
                                logger.info("❌ Not creating ticket - speech recognition issue, not knowledge gap")
                                return
                            elif self.last_clear_question and self.last_clear_question != "Customer inquiry (audio not captured)":
                                # Use the last clear question the AI couldn't answer
                                question_for_ticket = self.last_clear_question
                            elif self.recent_user_question and self.recent_user_question != "Customer inquiry (audio not captured)":
                                # Use the recent question
                                question_for_ticket = self.recent_user_question
                            else:
                                # No clear question to escalate
                                logger.info("❌ Not creating ticket - no clear question to escalate")
                                return

                            logger.info(f"✅ Creating ticket for unanswered question: {question_for_ticket}")

                            # Create help request for the specific question AI couldn't answer
                            await self._create_help_request_for_escalation(
                                user_question=question_for_ticket,
                                ai_response=agent_text
                            )

                    except Exception as e:
                        logger.error(f"Error processing agent speech: {e}")

                # Create async task
                import asyncio
                asyncio.create_task(process_agent_speech())

            # Hook into user speech events
            @agent.on("user_speech_committed")
            def on_user_speech(speech_event):
                """Handle user speech events to capture questions"""
                try:
                    logger.info(f"🔍 USER SPEECH EVENT TRIGGERED!")
                    logger.info(f"🔍 Raw user speech event: {speech_event}")
                    logger.info(f"🔍 Speech event type: {type(speech_event)}")
                    logger.info(f"🔍 Speech event dict: {speech_event.__dict__ if hasattr(speech_event, '__dict__') else 'No __dict__'}")

                    # Handle different speech event formats
                    user_text = None

                    if isinstance(speech_event, dict):
                        # If it's a dict, look for common transcript fields
                        user_text = (speech_event.get('user_transcript') or
                                   speech_event.get('transcript') or
                                   speech_event.get('text'))
                        logger.info(f"🔍 Extracted from dict: {user_text}")
                    elif isinstance(speech_event, str):
                        user_text = speech_event
                        logger.info(f"🔍 Direct string: {user_text}")
                    elif hasattr(speech_event, 'alternatives') and speech_event.alternatives:
                        user_text = speech_event.alternatives[0].text
                        logger.info(f"🔍 From alternatives: {user_text}")
                    elif hasattr(speech_event, 'text'):
                        user_text = speech_event.text
                        logger.info(f"🔍 From text attribute: {user_text}")
                    elif hasattr(speech_event, 'user_transcript'):
                        user_text = speech_event.user_transcript
                        logger.info(f"🔍 From user_transcript: {user_text}")
                    else:
                        user_text = str(speech_event)
                        logger.info(f"🔍 Fallback to string: {user_text}")

                    if user_text and user_text != "...":
                        self.recent_user_question = user_text
                        self.last_clear_question = user_text  # Store as clearly understood
                        logger.info(f"✅ 👤 User asked: {user_text}")
                    elif user_text == "...":
                        # Keep the last valid question when transcription fails
                        # But mark that current speech failed
                        self.recent_user_question = "Speech unclear - please repeat"
                        logger.warning(f"⚠️ Speech transcription failed, last clear question was: {self.last_clear_question}")
                    else:
                        logger.warning(f"⚠️ No valid user text found in speech event")

                except Exception as e:
                    logger.error(f"❌ Error processing user speech: {e}")
                    logger.error(f"❌ Speech event details: {speech_event}")

            logger.info("✅ LiveKit event handlers set up successfully")

        except Exception as e:
            logger.error(f"❌ Failed to set up LiveKit event handlers: {e}")
            # Continue without event handlers - fallback to manual detection

    def _is_escalation_response(self, response_text: str) -> bool:
        """Check if AI response contains escalation keywords"""
        if not response_text:
            return False

        escalation_keywords = [
            "check with my supervisor",
            "get back to you shortly",
            "supervisor",
            "let me check",
            "I'll need to ask",
            "I'm not sure",
            "I don't know",
            "let me find out",
            "I'll have someone",
            "speak to a manager"
        ]

        response_lower = response_text.lower()
        return any(keyword in response_lower for keyword in escalation_keywords)

    async def _create_help_request_for_escalation(self, user_question: str, ai_response: str):
        """Create help request when escalation is detected"""
        try:
            logger.info(f"🎫 Creating help request for escalation")

            # Use backend client to create help request
            result = await backend_client.process_query(
                question=user_question or "Customer question (audio)",
                customer_phone=self.customer_phone or "unknown",
                customer_name=None,
                call_session_id=self.call_session_id,
                context=f"User: {user_question}\nAI: {ai_response}"
            )

            if result.get("help_request_id"):
                logger.info(f"✅ Help request created: {result['help_request_id']}")
                print(f"\n🎫 TICKET CREATED: {result['help_request_id']}")
                print(f"Question: {user_question}")
                print(f"AI Response: {ai_response}\n")
            else:
                logger.warning(f"⚠️  Help request creation failed: {result}")

        except Exception as e:
            logger.error(f"❌ Error creating help request: {e}")
            # Fallback - direct HTTP call
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "http://localhost:8001/ai/query",
                        json={
                            "question": user_question or "Customer needs assistance",
                            "customer_phone": "+15551234567",  # Fallback phone
                            "context": f"Escalation detected. User: {user_question}, AI: {ai_response}"
                        },
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        result = response.json()
                        logger.info(f"✅ Fallback help request created: {result.get('help_request_id')}")
            except Exception as fallback_error:
                logger.error(f"❌ Fallback help request failed: {fallback_error}")



async def run_multimodal_agent(
    ctx: JobContext, participant: rtc.RemoteParticipant, config: SessionConfig
) -> SessionManager:
    logger.info("starting multimodal agent")

    session_manager = SessionManager(config)

    # Set up transcript capture handler
    global transcript_handler
    if transcript_handler is None:
        transcript_handler = TranscriptCaptureHandler(session_manager)
        # Add handler to livekit.agents logger
        livekit_logger = logging.getLogger("livekit.agents")
        livekit_logger.addHandler(transcript_handler)
        livekit_logger.setLevel(logging.DEBUG)  # Ensure debug messages are captured
        logger.info("✅ Transcript capture handler installed")

        # Test the handler immediately
        logger.info("🔍 Testing transcript handler setup...")
        test_log = logging.LogRecord(
            name="livekit.agents",
            level=logging.DEBUG,
            pathname="",
            lineno=0,
            msg='committed user speech {"user_transcript": "test message", "interrupted": false}',
            args=(),
            exc_info=None
        )
        transcript_handler.emit(test_log)
        logger.info("🔍 Handler test completed")

    initial_chat_ctx = get_initial_chat_ctx()  # Get fresh context
    await session_manager.setup_session(ctx, participant, initial_chat_ctx)  # Now async

    return session_manager


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))
