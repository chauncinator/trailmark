-- Seed data for hackathon demo
-- Run after schema.sql

-- Demo workers
INSERT INTO workers (wallet_address, name, bio, location, category, subcategory, tier, quality_score, completion_rate) VALUES
('0x1234567890abcdef1234567890abcdef12345678', 'Marcus Johnson', 'Licensed electrician with 12 years experience. Specialize in residential and small commercial panel upgrades.', 'Near Southside, Fort Worth', 'trades_licensed', 'electrical', 2, 420, 95),
('0xabcdef1234567890abcdef1234567890abcdef12', 'Sarah Chen', 'Full-stack web developer. Built sites for local food trucks, restaurants, and retail shops.', 'Cultural District, Fort Worth', 'digital', 'web_dev', 1, 380, 88),
('0x9876543210fedcba9876543210fedcba98765432', 'David Rivera', 'Reliable lawn care and landscaping. Serving Riverside and surrounding neighborhoods for 5 years.', 'Riverside, Fort Worth', 'trades_unlicensed', 'landscaping', 0, 200, 75),
('0x1111222233334444555566667777888899990000', 'Keisha Williams', 'Certified math tutor. TCU graduate. Specialize in SAT/ACT prep for high school students.', 'TCU area, Fort Worth', 'services', 'tutoring', 1, 400, 92),
('0xaaaabbbbccccddddeeeeffff0000111122223333', 'Tommy Barker', 'Interior and exterior painting. 8 years experience. Free estimates.', 'Magnolia, Fort Worth', 'trades_unlicensed', 'painting', 1, 310, 85);

-- Demo jobs
INSERT INTO jobs (id, client_wallet, title, description, category, subcategory, budget_eth, tier_required, location, status) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '0xclient111111111111111111111111111111111111', 'Electrical panel upgrade — Near Southside duplex', '1970s duplex needs full panel upgrade from 100A to 200A. Current panel has aluminum wiring that needs copper pigtail connections. Permits already pulled by owner.', 'trades_licensed', 'electrical', 0.15, 2, 'Near Southside, Fort Worth', 'open'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '0xclient222222222222222222222222222222222222', 'Small business website — food truck, Cultural District', 'Need a simple 4-page website for a food truck: menu, location schedule, catering info, contact form. Must be mobile-first. SEO for "Fort Worth food truck" and "catering Fort Worth".', 'digital', 'web_dev', 0.08, 1, 'Cultural District, Fort Worth', 'open'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '0xclient333333333333333333333333333333333333', 'Weekly lawn care — Riverside neighborhood', 'Standard weekly lawn mowing, edging, and blowing for a quarter-acre lot. May need occasional bush trimming. Looking for someone reliable for ongoing weekly service.', 'trades_unlicensed', 'landscaping', 0.02, 0, 'Riverside, Fort Worth', 'open'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '0xclient444444444444444444444444444444444444', 'SAT math tutoring — TCU area student', 'My daughter is a junior needing SAT math prep. Looking for 8 sessions over 4 weeks (2x/week). She scored 520 on math practice test, targeting 650+.', 'services', 'tutoring', 0.04, 1, 'TCU area, Fort Worth', 'open'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '0xclient555555555555555555555555555555555555', 'Interior painting — Magnolia Ave commercial space', 'New restaurant buildout on Magnolia. Need 1200 sq ft painted: main dining area, kitchen prep area, and one bathroom. Walls are new drywall, already taped and floated. Color is warm white for dining, eggshell finish.', 'trades_unlicensed', 'painting', 0.06, 0, 'Magnolia, Fort Worth', 'open');

-- Milestones for each job
INSERT INTO milestones (job_id, index, name, amount_eth) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, 'Materials inspection', 0.03),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Panel removal and rough-in', 0.07),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Final inspection pass', 0.05),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 0, 'Design mockup approved', 0.02),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 1, 'Site live with menu and contact', 0.04),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 2, 'Mobile responsive + SEO', 0.02),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 0, 'First visit complete', 0.02),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 0, '4 sessions complete', 0.02),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1, 'Practice test improvement verified', 0.02),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 0, 'Prep and primer', 0.02),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 1, 'Two coats complete', 0.04);

-- Demo attestations
INSERT INTO attestations (worker_wallet, attester_wallet, credential_type, category, subcategory, external_ref) VALUES
('0x1234567890abcdef1234567890abcdef12345678', '0xattester0000000000000000000000000000000', 'LICENSE', 'trades_licensed', 'electrical', 'TDLR-ELEC-28123'),
('0x1234567890abcdef1234567890abcdef12345678', '0xattester1111111111111111111111111111111', 'WORK_RECORD', 'trades_licensed', 'electrical', 'job://demo-1'),
('0x1234567890abcdef1234567890abcdef12345678', '0xattester2222222222222222222222222222222', 'PEER_ATTESTATION', 'trades_licensed', 'electrical', NULL),
('0xabcdef1234567890abcdef1234567890abcdef12', '0xattester3333333333333333333333333333333', 'PEER_ATTESTATION', 'digital', 'web_dev', NULL),
('0x1111222233334444555566667777888899990000', '0xattester4444444444444444444444444444444', 'CERTIFICATION', 'services', 'tutoring', 'CERT-MATH-TCU-2024');
