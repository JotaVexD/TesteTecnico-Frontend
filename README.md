## Início Rápido

### Pré-requisitos
- Node.js 18+
- Angular CLI

## Passos para Executar
1. Clone o repositório ou baixe os arquivos
2. Abra o terminal na pasta do frontend:

```bash
#Instale as dependências:
npm install

#Execute a aplicação:
npm start
```

3. Acesse no navegador
  - http://localhost:4200

## Configuração
Certifique-se que o backend está rodando e atualize a URL se necessário:

Em src/app/services/repository.service.ts
```
private apiUrl = 'http://localhost:5000/api/Repositories';
```

## Comandos Úteis
```bash
# Desenvolvimento
npm start              # Inicia servidor de desenvolvimento

# Instalação
npm install           # Instala todas as dependências
npm update           # Atualiza dependências

# Limpe o cache do npm
npm cache clean --force

# Remova node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
