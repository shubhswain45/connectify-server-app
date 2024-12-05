export const types = `#graphql
  type Playlist {
    id: ID!
    name: String!
    coverImageUrl: String!
    visibility: Visibility!
    author: User!
    tracks: [Track]!
  }

  enum Visibility {
    Public
    Private
  }

  input createPlaylistPayload {
    name: String!
    coverImageUrl: String!
    visibility: Visibility!
    tracks: [String]!
  }
`
