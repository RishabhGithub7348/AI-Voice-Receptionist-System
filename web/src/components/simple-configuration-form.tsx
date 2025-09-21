"use client";

import { useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { VoiceId } from "@/data/voices";
import { ModelId } from "@/data/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import { defaultSessionConfig } from "@/data/playground-state";
import { ModalitiesId } from "@/data/modalities";
import { Slider } from "@/components/ui/slider";

export const SimpleConfigurationFormSchema = z.object({
  model: z.nativeEnum(ModelId),
  modalities: z.nativeEnum(ModalitiesId),
  voice: z.nativeEnum(VoiceId),
  temperature: z.number().min(0.6).max(1.2),
});

export function SimpleConfigurationForm() {
  const { pgState, dispatch } = usePlaygroundState();
  const form = useForm<z.infer<typeof SimpleConfigurationFormSchema>>({
    resolver: zodResolver(SimpleConfigurationFormSchema),
    defaultValues: {
      model: defaultSessionConfig.model,
      modalities: defaultSessionConfig.modalities,
      voice: defaultSessionConfig.voice,
      temperature: defaultSessionConfig.temperature,
    },
    mode: "onChange",
  });
  const formValues = form.watch();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFormUpdate = useCallback(
    (values: z.infer<typeof SimpleConfigurationFormSchema>) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        dispatch({
          type: "SET_SESSION_CONFIG",
          payload: { ...values, maxOutputTokens: null },
        });
      }, 200);
    },
    [dispatch]
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (Object.values(values).every((val) => val !== undefined)) {
        handleFormUpdate(values as z.infer<typeof SimpleConfigurationFormSchema>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, handleFormUpdate]);

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Call Configuration</h3>
        <p className="text-sm text-gray-600">Configure the AI voice settings</p>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Voice</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                                  >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={VoiceId.PUCK}>Puck (Warm, natural)</SelectItem>
                    <SelectItem value={VoiceId.CHARON}>Charon (Professional)</SelectItem>
                    <SelectItem value={VoiceId.KORE}>Kore (Friendly)</SelectItem>
                    <SelectItem value={VoiceId.FENRIR}>Fenrir (Deep, confident)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Conversation Style: {field.value}
                </FormLabel>
                <FormControl>
                  <Slider
                    min={0.6}
                    max={1.2}
                    step={0.1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                                        className="w-full"
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>More Focused</span>
                  <span>More Creative</span>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Model</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                                  >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ModelId.GEMINI_2_0_FLASH_EXT}>
                      Gemini 2.0 Flash (Recommended)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}