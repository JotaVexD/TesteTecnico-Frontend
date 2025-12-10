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
Este projeto usa um **proxy** para conectar com o backend. A URL do backend é configurada em **UM único lugar**:

### Para Desenvolvimento (localhost):
1. Edite o arquivo: `proxy.conf.json`
2. Altere a propriedade `target`:
```json
{
  "/api": {
    "target": "http://localhost:5001", 
    "secure": false
  }
}
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
