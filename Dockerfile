FROM node:16

WORKDIR /usr/src/app

COPY package.json yark.lock ./

RUN yarn install

RUN yarn generate

COPY . .

RUN yarn build

EXPOSE 8080

CMD ["npm", "start"]