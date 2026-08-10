from node:22.16.0

WORKDIR /app

COPY package*.json ./

RUN npm install



COPY . .

RUN npm run build


RUN cp -r src/templates dist/templates

LABEL version="1.0"
LABEL author="Hany El Kholey"
LABEL description="Droply backend"


ENV NODE_ENV=production

CMD ["npm", "start"]