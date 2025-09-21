-- Voice Receptionist AI System Database Schema
-- Migration 002: Seed data for knowledge base

-- Sample business data for voice receptionist
INSERT INTO knowledge_base (question, answer, category, source) VALUES
('What are your business hours?', 'We are open Monday through Friday 9 AM to 7 PM, Saturday 9 AM to 5 PM, and closed on Sundays.', 'hours', 'manual'),
('What services do you offer?', 'We offer haircuts, hair coloring, highlights, blowouts, hair styling, manicures, pedicures, facials, and eyebrow services.', 'services', 'manual'),
('How much does a haircut cost?', 'Basic haircuts start at $45. Cut and style packages start at $65. Prices may vary based on hair length and complexity.', 'pricing', 'manual'),
('Do you accept walk-ins?', 'We prefer appointments but accept walk-ins when possible. Call ahead to check availability.', 'appointments', 'manual'),
('What is your cancellation policy?', 'Please give us at least 24 hours notice for cancellations. Same-day cancellations may be subject to a fee.', 'policies', 'manual'),
('Do you offer gift certificates?', 'Yes, we offer gift certificates for any dollar amount or specific services. They can be purchased in-store or over the phone.', 'gift_certificates', 'manual');