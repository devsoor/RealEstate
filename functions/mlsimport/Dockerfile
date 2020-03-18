FROM node:7
RUN npm install -g serverless
COPY . ./app
WORKDIR /app
CMD serverless deploy --stage staging