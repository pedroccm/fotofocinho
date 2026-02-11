# Fotofocinho - Pet Portrait AI

## Deploy

- **Plataforma:** Netlify
- **Site:** https://fotofocinho-pet.netlify.app
- **Admin:** https://app.netlify.com/projects/fotofocinho-pet
- **Conta:** pedroccm@gmail.com (team: gaia)
- **Deploy:** Automático via GitHub (push no master)

### Comandos de Deploy

```bash
# Login (se necessário)
npx netlify-cli login

# Status do projeto
npx netlify-cli status

# Deploy manual (normalmente não precisa, é automático)
npx netlify-cli deploy --prod
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

### AbacatePay API Keys

```
# Dev (atual no Netlify)
abc_dev_T4RxjGUGRbCf4HZSZteyj0bJ

# Prod (comentado para quando for pra produção)
# abc_prod_dJjsKsWtuJzsYbtNYfP4XwdB
```

## Stack

- **Frontend:** Next.js 16 com App Router
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini + AIML API
- **Pagamentos:** AbacatePay
- **Email:** Resend

## GitHub

- **Repo:** https://github.com/pedroccm/fotofocinho
- **Account:** pedroccm
