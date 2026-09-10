-- Seed dynamic categories (examples, not hardcoded in frontend)
INSERT OR IGNORE INTO categories (id, name, slug, description, is_published, sort_order) VALUES
('cat_weddings', 'Weddings', 'weddings', 'Stories of love, beautifully captured — from preparations to reception.', 1, 1),
('cat_kukyala', 'Kukyala', 'kukyala', 'Traditional introduction ceremonies — vibrant cultural portraits and family moments.', 1, 2),
('cat_graduation', 'Graduation', 'graduation', 'Milestones worth framing — proud portraits and family celebrations.', 1, 3),
('cat_prom', 'Prom', 'prom', 'Elegant prom portraits — youthful celebration and style.', 1, 4),
('cat_baby_bump', 'Baby Bump', 'baby-bump', 'Tender maternity sessions — expectation, grace and connection.', 1, 5),
('cat_baby_shoots', 'Baby Shoots', 'baby-shoots', 'Gentle newborn and family moments — soft, warm and timeless.', 1, 6);

INSERT OR IGNORE INTO albums (id, name, slug, description, is_published, sort_order) VALUES
('alb_weddings', 'Wedding Photography', 'weddings', 'Wedding Photography', 1, 1),
('alb_kukyala', 'Kukyala', 'kukyala', 'Traditional Kukyala', 1, 2),
('alb_graduation', 'Graduation', 'graduation', 'Graduation', 1, 3),
('alb_prom', 'Prom', 'prom', 'Prom', 1, 4),
('alb_baby_bump', 'Baby Bump', 'baby-bump', 'Baby Bump', 1, 5),
('alb_baby_shoots', 'Baby Shoots', 'baby-shoots', 'Baby Shoots', 1, 6);
