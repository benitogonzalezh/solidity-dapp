FROM node:10.16.3

WORKDIR /dapp

#Install Python 2.7.7
RUN apt-get update && apt-get install -y python2.7

#Install other dependencies
RUN npm install -g node-gyp@3.6.2
RUN npm install -g truffle@5.1.39 
RUN npm install -g ganache-cli
RUN npm install -g create-react-app@3.3.1

