FROM node:16-alpine

WORKDIR /usr/app

COPY . .

RUN npm install
RUN npm -g install nodemon

CMD ["npm", "start", "dev"]