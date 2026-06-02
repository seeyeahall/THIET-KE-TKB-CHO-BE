# Runtime Key Integration

## Nguyen tac bao mat

File `seeyeahall ALL key.txt` la file chua secret. Khong commit, khong copy key vao markdown, khong dua key vao frontend.

Moi AI tiep theo can doc file nay chi de:

- Nhan dien provider.
- Test key bang endpoint nhe.
- Chon key thanh cong.
- Ghi lai provider va key index, khong ghi raw key.

## Ket qua test ngay 2026-06-02

Test da dung endpoint list models hoac endpoint tuong duong, khong goi sinh noi dung.

| Provider | Key index trong file | Ket qua | Endpoint test |
|---|---:|---|---|
| OpenAI | 2 | success | `GET https://api.openai.com/v1/models` |
| Gemini | 2 | success | `GET https://generativelanguage.googleapis.com/v1beta/models` |
| Gemini | 3 | success | `GET https://generativelanguage.googleapis.com/v1beta/models` |
| Gemini | 4 | success | `GET https://generativelanguage.googleapis.com/v1beta/models` |
| Gemini | 5 | success | `GET https://generativelanguage.googleapis.com/v1beta/models` |
| Gemini | 6 | success | `GET https://generativelanguage.googleapis.com/v1beta/models` |
| Kimi/Moonshot | 2 | success | `GET https://api.moonshot.ai/v1/models` |
| Kimi/Moonshot | 6 | success | `GET https://api.moonshot.ai/v1/models` |
| Together AI | 1 | success | `GET https://api.together.xyz/v1/models` |
| Groq | 1 | success | `GET https://api.groq.com/openai/v1/models` |
| OpenRouter | 1 | success | `GET https://openrouter.ai/api/v1/models` |
| DeepSeek | 1 | success | `GET https://api.deepseek.com/v1/models` |

## Key that bai

| Provider | Key index | Ket qua |
|---|---:|---|
| OpenAI | 1 | 401 |
| OpenAI | 3 | 403 |
| Gemini | 1 | 400 |
| Kimi/Moonshot | 1 | 401 |
| Kimi/Moonshot | 3 | 401 |
| Kimi/Moonshot | 4 | 401 |
| Kimi/Moonshot | 5 | 401 |

## Provider chua dua vao runtime dau tien

- Cloudflare: can tach ro `account_id`, API token co scope nao, zone nao, R2 co dung khong.
- BytePlus ModelArk: can xac dinh endpoint va model mac dinh.
- Minimax: can xac dinh endpoint/model/capability.
- Ollama: neu la local/remote endpoint, can URL base, khong chi key.
- Continue.dev: khong phai provider runtime cua app.
- SSH/service account: khong dung cho AI runtime.

## Env names de tao sau

Backend FastAPI nen dung env theo dang:

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
MOONSHOT_API_KEY=
TOGETHER_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
DEEPSEEK_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
```

## Thu tu provider mac dinh de MVP

De tiet kiem va de fallback:

1. Gemini: co nhieu key success, phu hop lam fallback chat.
2. OpenRouter: mot endpoint gom nhieu model.
3. DeepSeek: endpoint OpenAI-compatible, tot cho chat/generate schedule.
4. Groq: nhanh, tot cho chat nhe.
5. OpenAI: key #2 success, dung cho chat/chat quality neu can.
6. Together/Kimi: dung nhu provider mo rong.

## Quy tac tich hop vao app

- Khi scaffold backend, tao bang `ai_providers`.
- Khi seed provider, chi seed metadata va doc secret tu env.
- Khong seed raw key vao migration.
- Admin panel co the add them key sau.
- Endpoint `/ai/providers/{id}/test` phai test lai truoc khi active.

