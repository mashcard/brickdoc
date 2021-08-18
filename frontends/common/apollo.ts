import { ApolloClient, InMemoryCache, createHttpLink, split, NormalizedCacheObject } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import * as ActionCable from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'
import { InMemoryCacheConfig } from '@apollo/client/cache/inmemory/inMemoryCache'

const securityLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'X-CSRF-Token': globalThis.brickdocContext?.csrfToken
    }
  }
})

const httpLink = securityLink.concat(
  createHttpLink({
    uri: globalThis.brickdocContext?.internalApiEndpoint,
    credentials: 'same-origin'
  })
)

export const cable = ActionCable.createConsumer()

const websocketLink = new ActionCableLink({ cable, channelName: 'InternalGraphQLChannel' })

// If subscription operation or operation name end with 'FromWS' use WebSocket else use HTTP.
const brickdocLink = split(
  ({ query, operationName }) => {
    const definition = getMainDefinition(query)
    return (definition.kind === 'OperationDefinition' && definition.operation === 'subscription') || operationName.endsWith('FromWS')
  },
  websocketLink,
  httpLink
)

export const apolloClient = (cacheConfig?: InMemoryCacheConfig): ApolloClient<NormalizedCacheObject> =>
  new ApolloClient({
    link: brickdocLink,
    cache: new InMemoryCache(cacheConfig),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network'
      },
      query: {
        fetchPolicy: 'network-only'
      }
    }
  })
