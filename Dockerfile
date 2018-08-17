FROM node:8

COPY . /app

WORKDIR /app

CMD ["npm", "start", "-s"]
