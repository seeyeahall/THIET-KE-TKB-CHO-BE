"""Demo in-memory data for local development when Supabase is not configured."""

from datetime import date

DEMO_FAMILY = {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Gia đình Demo",
    "parent_user_id": "local-dev-user",
}

DEMO_CHILDREN = [
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "family_id": "11111111-1111-1111-1111-111111111111",
        "name": "Bông",
        "age": 7,
        "favorite_color": "hồng",
        "favorite_animal": "thỏ",
        "interests": ["vẽ", "cây cối"],
        "dislikes": ["đá bóng"],
        "avatar_url": None,
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "family_id": "11111111-1111-1111-1111-111111111111",
        "name": "Bin",
        "age": 8,
        "favorite_color": "xanh",
        "favorite_animal": "cá voi",
        "interests": ["khoa học", "bơi"],
        "dislikes": [],
        "avatar_url": None,
    },
]

DEMO_ACTIVITIES = [
    {"id": "44444444-4444-4444-4444-444444444444", "title": "Vẽ tranh cây cối", "slug": "ve-tranh-cay-coi", "theme": "Nghệ thuật", "description": "Dùng màu nước vẽ cây trong vườn", "duration_minutes": 30, "difficulty": "Dễ", "requires_parent": False, "status": "published", "min_age": 6, "max_age": 10},
    {"id": "44444444-4444-4444-4444-444444444445", "title": "Đọc truyện khoa học", "slug": "doc-truyen-khoa-hoc", "theme": "Học tập", "description": "Khám phá vũ trụ qua sách tranh", "duration_minutes": 20, "difficulty": "Dễ", "requires_parent": False, "status": "published", "min_age": 6, "max_age": 10},
    {"id": "44444444-4444-4444-4444-444444444446", "title": "Trồng cây đậu", "slug": "trong-cay-dau", "theme": "Thiên nhiên", "description": "Theo dõi sự mọc của hạt đậu", "duration_minutes": 15, "difficulty": "Dễ", "requires_parent": True, "status": "published", "min_age": 6, "max_age": 10},
    {"id": "44444444-4444-4444-4444-444444444447", "title": "Thể dục buổi sáng", "slug": "the-duc-buoi-sang", "theme": "Vận động", "description": "Nhảy dây và vươn vai", "duration_minutes": 15, "difficulty": "Dễ", "requires_parent": False, "status": "published", "min_age": 6, "max_age": 10},
    {"id": "44444444-4444-4444-4444-444444444448", "title": "Làm thí nghiệm nước", "slug": "lam-thi-nghiem-nuoc", "theme": "Học tập", "description": "Quan sát nổi chìm của vật", "duration_minutes": 25, "difficulty": "Trung bình", "requires_parent": True, "status": "published", "min_age": 6, "max_age": 10},
    {"id": "44444444-4444-4444-4444-444444444449", "title": "Làm đồ handmade", "slug": "lam-do-handmade", "theme": "Nghệ thuật", "description": "Tái chế giấy làm thiệp", "duration_minutes": 40, "difficulty": "Trung bình", "requires_parent": True, "status": "published", "min_age": 6, "max_age": 10},
]

DEMO_SCHEDULES = [
    {
        "id": "55555555-5555-5555-5555-555555555555",
        "child_id": "22222222-2222-2222-2222-222222222222",
        "title": "Lịch tuần của Bông",
        "week_start_date": str(date.today()),
        "theme": "Khám phá",
    },
]

DEMO_SCHEDULE_ITEMS = [
    {"id": "66666666-6666-6666-6666-666666666666", "schedule_id": "55555555-5555-5555-5555-555555555555", "child_id": "22222222-2222-2222-2222-222222222222", "activity_id": "44444444-4444-4444-4444-444444444445", "day_of_week": 1, "start_time": "08:00", "duration_minutes": 30, "status": "planned", "sort_order": 0},
    {"id": "66666666-6666-6666-6666-666666666667", "schedule_id": "55555555-5555-5555-5555-555555555555", "child_id": "22222222-2222-2222-2222-222222222222", "activity_id": "44444444-4444-4444-4444-444444444444", "day_of_week": 1, "start_time": "15:00", "duration_minutes": 45, "status": "planned", "sort_order": 1},
    {"id": "66666666-6666-6666-6666-666666666668", "schedule_id": "55555555-5555-5555-5555-555555555555", "child_id": "22222222-2222-2222-2222-222222222222", "activity_id": "44444444-4444-4444-4444-444444444447", "day_of_week": 2, "start_time": "16:00", "duration_minutes": 60, "status": "planned", "sort_order": 0},
]

DEMO_REWARDS = [
    {"id": "77777777-7777-7777-7777-777777777777", "child_id": "22222222-2222-2222-2222-222222222222", "xp": 142, "coins": 50, "streak_days": 3},
    {"id": "77777777-7777-7777-7777-777777777778", "child_id": "33333333-3333-3333-3333-333333333333", "xp": 89, "coins": 30, "streak_days": 1},
]

DEMO_DB = {
    "families": [DEMO_FAMILY],
    "children": DEMO_CHILDREN,
    "activities": DEMO_ACTIVITIES,
    "schedules": DEMO_SCHEDULES,
    "schedule_items": DEMO_SCHEDULE_ITEMS,
    "rewards": DEMO_REWARDS,
}
