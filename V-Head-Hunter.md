# V-Head Hunter · Departamento de Profissionais

A rota pública é `/v-head-hunter/`. Depois do deploy do ATS Analyzer no Netlify, use um link para essa rota na porta do Departamento de Profissionais da Tower. O Analyzer continua em `/`.

## Configuração no Netlify

Use o comando `npm run build` e publique `out`, conforme netlify.toml. As funções ficam em `netlify/functions`. Cadastros autorizados usam o store privado `community-applications` do Netlify Blobs. Configure `VWORK_DIRECTORY_TOKEN` como segredo das funções e disponibilize a credencial aos responsáveis pelo departamento. A consulta retorna até 50 perfis por pesquisa. No preview, use apenas inscrições de teste, pois o store é compartilhado entre deploys do mesmo site.

O radar usa Remotive por demanda e importa o JSON do Head Hunter Diário, com a lista `vagas`. LinkedIn e Indeed abrem buscas na sessão do próprio usuário. Rodadas sem descrição completa pedem o texto na tela de análise.

O estúdio usa análise local para o módulo de aderência isolado ou uma chave Anthropic informada na página. Transcrição opcional usa uma chave OpenAI. Essas chaves do estúdio ficam em memória até sair da página. O botão informa quando o material será enviado ao provedor. PDF e Word são gerados no navegador.
