FROM debian
LABEL maintainer "valentin.stern@zenika.com"

# Update repositories
RUN apt-get update

RUN apt-get install -y curl gnupg

# Update dependency for nodejs and npm
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -

RUN apt-get install -y libcblas.so.3 sox python nodejs
RUN npm i -g forever

WORKDIR /src
ADD . .

RUN npm install

EXPOSE 8080
CMD forever app.js