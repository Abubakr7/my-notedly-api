// app settings
const express = require('express');
const app = express();
const { ApolloServer } = require('apollo-server-express'); // apollo-server-express settings
const depthLimit = require('graphql-depth-limit'); // depthLimit
const { createComplexityLimitRule } = require('graphql-validation-complexity'); // graphql-validation-complexity
require('dotenv').config(); // .env connect
const jwt = require('jsonwebtoken'); // jwt
const helmet = require('helmet'); // helmet
app.use(helmet());
const cors = require('cors'); // cors
app.use(cors());

// Importing local modules
const db = require('./db'); // Database
const models = require('./models'); // models
const typeDefs = require('./schema'); // Building a schema using the GraphQL schema language
const resolvers = require('./res'); // Providing recognition functions for schema fields

// Env variables
const db_host = process.env.DB_HOST; // Store the DB_HOST value as a variable
const port = process.env.PORT || 4000; // We start the server on the port specified in the .env file, or on port 4000
db.connect(db_host); // Connect to DB

// get the user info from a JWT
const getUser = token => {
  if (token) {
    try {
      // return the user information from the token
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // if there's a problem with the token, throw an error
      throw new Error('Session invalid');
    }
  }
};

// Configuring Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: ({ req }) => {
    // get the user token from the headers
    const token = req.headers.authorization;
    // try to retrieve a user with the token
    const user = getUser(token);
    // add the db models and the user to the context
    return { models, user };
  }
});

// Apply Apollo GraphQL middleware and specify the path to / api
server.applyMiddleware({ app, path: '/api' });

// Routes
app.get('/', (req, res) => res.send('Hello Web Server!'));
app.listen({ port }, () =>
  console.log(
    `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
  )
);
