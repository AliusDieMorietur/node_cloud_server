FROM mhart/alpine-node:14
WORKDIR /app
COPY . .
RUN rm -r config
COPY ./config/docker ./config
EXPOSE 7000
RUN npm install
CMD sleep 5 && npm run add_user admin admin && npm start