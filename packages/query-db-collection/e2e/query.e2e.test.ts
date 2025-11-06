/**
 * Query Collection E2E Tests
 *
 * Tests using REAL Query collections with mock backend
 */

import { afterAll, beforeAll, describe } from "vitest"
import { createCollection } from "@tanstack/db"
import { QueryClient } from "@tanstack/query-core"
import { queryCollectionOptions } from "../src/query"
import {
  createCollationTestSuite,
  createDeduplicationTestSuite,
  createJoinsTestSuite,
  createLiveUpdatesTestSuite,
  createMutationsTestSuite,
  createPaginationTestSuite,
  createPredicatesTestSuite,
  createRegressionTestSuite,
  generateSeedData,
} from "../../db-collection-e2e/src/index"
import type {
  Comment as E2EComment,
  Post as E2EPost,
  E2ETestConfig,
  User as E2EUser,
} from "../../db-collection-e2e/src/types"

describe(`Query Collection E2E Tests`, () => {
  let config: E2ETestConfig
  let queryClient: QueryClient

  beforeAll(async () => {
    // Make seed data mutable so mutations can modify it
    const seedData = generateSeedData()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0,
          retry: false,
        },
      },
    })

    // Create REAL Query collections with mock backend queryFn
    const eagerUsers = createCollection(
      queryCollectionOptions({
        id: `query-e2e-users-eager`,
        queryClient,
        queryKey: [`e2e`, `users`, `eager`],
        queryFn: () => {
          // Mock query function that returns seed data
          return Promise.resolve(seedData.users)
        },
        getKey: (item: E2EUser) => item.id,
        startSync: true,
      })
    )

    const eagerPosts = createCollection(
      queryCollectionOptions({
        id: `query-e2e-posts-eager`,
        queryClient,
        queryKey: [`e2e`, `posts`, `eager`],
        queryFn: () => {
          return Promise.resolve(seedData.posts)
        },
        getKey: (item: E2EPost) => item.id,
        startSync: true,
      })
    )

    const eagerComments = createCollection(
      queryCollectionOptions({
        id: `query-e2e-comments-eager`,
        queryClient,
        queryKey: [`e2e`, `comments`, `eager`],
        queryFn: () => {
          return Promise.resolve(seedData.comments)
        },
        getKey: (item: E2EComment) => item.id,
        startSync: true,
      })
    )

    const onDemandUsers = createCollection(
      queryCollectionOptions({
        id: `query-e2e-users-ondemand`,
        queryClient,
        queryKey: [`e2e`, `users`, `ondemand`],
        queryFn: () => {
          return Promise.resolve(seedData.users)
        },
        getKey: (item: E2EUser) => item.id,
        startSync: false,
      })
    )

    const onDemandPosts = createCollection(
      queryCollectionOptions({
        id: `query-e2e-posts-ondemand`,
        queryClient,
        queryKey: [`e2e`, `posts`, `ondemand`],
        queryFn: () => {
          return Promise.resolve(seedData.posts)
        },
        getKey: (item: E2EPost) => item.id,
        startSync: false,
      })
    )

    const onDemandComments = createCollection(
      queryCollectionOptions({
        id: `query-e2e-comments-ondemand`,
        queryClient,
        queryKey: [`e2e`, `comments`, `ondemand`],
        queryFn: () => {
          return Promise.resolve(seedData.comments)
        },
        getKey: (item: E2EComment) => item.id,
        startSync: false,
      })
    )

    // Wait for eager collections to load
    await eagerUsers.preload()
    await eagerPosts.preload()
    await eagerComments.preload()

    // On-demand collections don't start automatically
    await onDemandUsers.preload()
    await onDemandPosts.preload()
    await onDemandComments.preload()

    config = {
      collections: {
        eager: {
          users: eagerUsers as any,
          posts: eagerPosts as any,
          comments: eagerComments as any,
        },
        onDemand: {
          users: onDemandUsers as any,
          posts: onDemandPosts as any,
          comments: onDemandComments as any,
        },
      },
      // Mutations for Query collections - modify seed data and invalidate queries
      mutations: {
        insertUser: async (user) => {
          seedData.users.push(user)
          await queryClient.invalidateQueries({ queryKey: [`e2e`, `users`] })
        },
        updateUser: async (id, updates) => {
          const userIndex = seedData.users.findIndex((u) => u.id === id)
          if (userIndex !== -1) {
            seedData.users[userIndex] = {
              ...seedData.users[userIndex]!,
              ...updates,
            }
            await queryClient.invalidateQueries({ queryKey: [`e2e`, `users`] })
          }
        },
        deleteUser: async (id) => {
          const userIndex = seedData.users.findIndex((u) => u.id === id)
          if (userIndex !== -1) {
            seedData.users.splice(userIndex, 1)
            await queryClient.invalidateQueries({ queryKey: [`e2e`, `users`] })
          }
        },
        insertPost: async (post) => {
          seedData.posts.push(post)
          await queryClient.invalidateQueries({ queryKey: [`e2e`, `posts`] })
        },
      },
      setup: async () => {},
      teardown: async () => {
        await Promise.all([
          eagerUsers.cleanup(),
          eagerPosts.cleanup(),
          eagerComments.cleanup(),
          onDemandUsers.cleanup(),
          onDemandPosts.cleanup(),
          onDemandComments.cleanup(),
        ])
        queryClient.clear()
      },
    }
  })

  afterAll(async () => {
    await config.teardown()
  })

  function getConfig() {
    return Promise.resolve(config)
  }

  // Run all test suites
  createPredicatesTestSuite(getConfig)
  createPaginationTestSuite(getConfig)
  createJoinsTestSuite(getConfig)
  createDeduplicationTestSuite(getConfig)
  createCollationTestSuite(getConfig)
  createMutationsTestSuite(getConfig)
  createLiveUpdatesTestSuite(getConfig)
  createRegressionTestSuite(getConfig)
})
