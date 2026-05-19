FROM node:18-alpine

# Dependências nativas que o Baileys precisa
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY src/ ./src/

# Pasta para salvar a sessão do WhatsApp
RUN mkdir -p sessions

EXPOSE 3000

CMD ["node", "src/index.js"]
