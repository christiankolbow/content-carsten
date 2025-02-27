// app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';

const typeDefs = gql`
  type Query {
    hello: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from content-carsten CMS with @apollo/server!',
  },
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

// Die Integration mit Next.js mithilfe von `@as-integrations/next`
export const handler = startServerAndCreateNextHandler(apolloServer);

export { handler as GET, handler as POST };
