import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

// Generate the data client with full type safety
export const client = generateClient<Schema>()

export type { Schema }