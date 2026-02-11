# Fotofocinho - Pet Portrait AI

## Deploy

- **Plataforma:** Netlify
- **CLI:** Usar `npx netlify-cli` para deploy
- **Conta:** pedroccm@gmail.com (team: gaia)

### Comandos de Deploy

```bash
# Login (se necessário)
npx netlify-cli login

# Status do projeto
npx netlify-cli status

# Deploy para produção (Netlify faz o build no servidor)
npx netlify-cli deploy --prod

# Criar novo site
npx netlify-cli sites:create --name nome-do-site
```

### Variáveis de Ambiente

Configurar no Netlify Dashboard ou via CLI:
- GEMINI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ABACATEPAY_API_KEY
- NEXT_PUBLIC_APP_URL
- ADMIN_SECRET_KEY
- RESEND_API_KEY
- RESEND_FROM
- AIML_API_KEY

## Stack

- **Frontend:** Next.js 16 com App Router
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini + AIML API
- **Pagamentos:** AbacatePay
- **Email:** Resend

## GitHub

- **Repo:** https://github.com/pedroccm/fotofocinho
- **Account:** pedroccm
