/**
 * Electric E2E Test Setup
 *
 * Provides configuration and helpers for Electric collection e2e tests
 */

import { createCollection } from "@tanstack/db"
import { electricCollectionOptions } from "../src/electric"
import type {
  Comment as E2EComment,
  Post as E2EPost,
  E2ETestConfig,
  User as E2EUser,
} from "../../db-collection-e2e/src/types"
import type { Collection } from "@tanstack/db"

const ELECTRIC_URL = process.env.ELECTRIC_URL ?? `http://localhost:3000`

/**
 * Create Electric collection configuration for e2e tests
 */
export function createElectricE2EConfig(options: {
  schema: string
  usersTable: string
  postsTable: string
  commentsTable: string
  baseUrl?: string
}): E2ETestConfig {
  const {
    schema,
    usersTable,
    postsTable,
    commentsTable,
    baseUrl = ELECTRIC_URL,
  } = options

  // Create eager mode collections (sync entire dataset)
  const eagerUsers = createCollection(
    electricCollectionOptions<E2EUser & Record<string, unknown>>({
      id: `electric-e2e-users-eager-${Date.now()}`,
      shapeOptions: {
        url: `${baseUrl}/v1/shape`,
        params: {
          table: `${schema}.${usersTable}`,
        },
      },
      syncMode: `eager`,
      getKey: (item: E2EUser & Record<string, unknown>) => item.id,
      startSync: false, // Start manually in tests
    })
  ) as unknown as Collection<E2EUser>

  const eagerPosts = createCollection(
    electricCollectionOptions<E2EPost & Record<string, unknown>>({
      id: `electric-e2e-posts-eager-${Date.now()}`,
      shapeOptions: {
        url: `${baseUrl}/v1/shape`,
        params: {
          table: `${schema}.${postsTable}`,
        },
      },
      syncMode: `eager`,
      getKey: (item: E2EPost & Record<string, unknown>) => item.id,
      startSync: false,
    })
  ) as unknown as Collection<E2EPost>

  const eagerComments = createCollection(
    electricCollectionOptions<E2EComment & Record<string, unknown>>({
      id: `electric-e2e-comments-eager-${Date.now()}`,
      shapeOptions: {
        url: `${baseUrl}/v1/shape`,
        params: {
          table: `${schema}.${commentsTable}`,
        },
      },
      syncMode: `eager`,
      getKey: (item: E2EComment & Record<string, unknown>) => item.id,
      startSync: false,
    })
  ) as unknown as Collection<E2EComment>

  // Create on-demand mode collections (load subsets as needed)
  const onDemandUsers = createCollection(
    electricCollectionOptions<E2EUser & Record<string, unknown>>({
      id: `electric-e2e-users-ondemand-${Date.now()}`,
      shapeOptions: {
        url: `${baseUrl}/v1/shape`,
        params: {
          table: `${schema}.${usersTable}`,
        },
      },
      syncMode: `on-demand`,
      getKey: (item: E2EUser & Record<string, unknown>) => item.id,
      startSync: false,
    })
  ) as unknown as Collection<E2EUser>

  const onDemandPosts = createCollection(
    electricCollectionOptions<E2EPost & Record<string, unknown>>({
      id: `electric-e2e-posts-ondemand-${Date.now()}`,
      shapeOptions: {
        url: `${baseUrl}/v1/shape`,
        params: {
          table: `${schema}.${postsTable}`,
        },
      },
      syncMode: `on-demand`,
      getKey: (item: E2EPost & Record<string, unknown>) => item.id,
      startSync: false,
    })
  ) as unknown as Collection<E2EPost>

  const onDemandComments = createCollection(
    electricCollectionOptions<E2EComment & Record<string, unknown>>({
      id: `electric-e2e-comments-ondemand-${Date.now()}`,
      shapeOptions: {
        url: `${baseUrl}/v1/shape`,
        params: {
          table: `${schema}.${commentsTable}`,
        },
      },
      syncMode: `on-demand`,
      getKey: (item: E2EComment & Record<string, unknown>) => item.id,
      startSync: false,
    })
  ) as unknown as Collection<E2EComment>

  return {
    collections: {
      eager: {
        users: eagerUsers,
        posts: eagerPosts,
        comments: eagerComments,
      },
      onDemand: {
        users: onDemandUsers,
        posts: onDemandPosts,
        comments: onDemandComments,
      },
    },
    setup: async () => {
      // Setup hook if needed
    },
    teardown: async () => {
      // Cleanup collections
      await Promise.all([
        eagerUsers.cleanup(),
        eagerPosts.cleanup(),
        eagerComments.cleanup(),
        onDemandUsers.cleanup(),
        onDemandPosts.cleanup(),
        onDemandComments.cleanup(),
      ])
    },
  }
}
