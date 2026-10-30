/**
 * Domain contracts for CivicPulse AI. JSDoc only — this module has no runtime
 * behaviour and is safe to import from anywhere.
 *
 * @typedef {'roads'|'water'|'waste'|'electricity'|'sanitation'|'public_safety'|'other'} Category
 * @typedef {'submitted'|'triaged'|'assigned'|'in_progress'|'resolved'|'closed'|'rejected'|'duplicate'} ReportStatus
 * @typedef {'P0'|'P1'|'P2'|'P3'} PriorityBand
 * @typedef {'strong'|'review'|'low'} DuplicateLevel
 * @typedef {'pending'|'confirmed'|'rejected'} DuplicateStatus
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} referenceCode
 * @property {string|null} citizenId
 * @property {string|null} title
 * @property {string} description
 * @property {Category} category
 * @property {string|null} locationLabel
 * @property {number} latitude
 * @property {number} longitude
 * @property {string|null} imageUrl
 * @property {ReportStatus} status
 * @property {number|null} priorityScore
 * @property {PriorityBand|null} priorityBand
 * @property {AiAnalysis|null} ai
 * @property {string|null} clusterKey
 * @property {string|null} department
 * @property {string|null} assignedTo
 * @property {string|null} slaDueAt
 * @property {string|null} duplicateOf
 * @property {boolean} duplicateConfirmed
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} resolvedAt
 */

/**
 * @typedef {Object} AiAnalysis
 * @property {'rules-v1'} version
 * @property {Category} category
 * @property {number} confidence
 * @property {{category: Category, score: number, confidence: number}[]} alternatives
 * @property {string} summary
 * @property {DuplicateCandidate[]} duplicates
 * @property {{score: number, band: PriorityBand, factors: PriorityFactor[], verdict: string}} priority
 * @property {ClusterSnapshot|null} cluster
 * @property {number} processingMs
 * @property {string} processedAt
 */

/**
 * @typedef {Object} DuplicateCandidate
 * @property {string} reportId
 * @property {string} referenceCode
 * @property {number} score
 * @property {DuplicateLevel} level
 * @property {{text: number, category: number, geo: number, time: number}} components
 * @property {number} distanceMeters
 * @property {number} ageDays
 * @property {string[]} reasons
 */

/**
 * @typedef {Object} PriorityFactor
 * @property {string} code
 * @property {string} label
 * @property {number} points
 * @property {string} detail
 */

/**
 * @typedef {Object} ClusterSnapshot
 * @property {string} key
 * @property {string} id
 * @property {string} label
 * @property {number} count
 * @property {Record<string, number>} categories
 * @property {number} avgPriority
 * @property {number} hotspotScore
 * @property {number} radiusMeters
 * @property {'rising'|'steady'|'falling'} trend
 */

/**
 * @typedef {Object} ReportEvent
 * @property {string} id
 * @property {string} reportId
 * @property {string|null} actorId
 * @property {'citizen'|'operator'|'admin'|'system'} actorRole
 * @property {string} type
 * @property {ReportStatus|null} fromStatus
 * @property {ReportStatus|null} toStatus
 * @property {boolean} isPublic
 * @property {string|null} note
 * @property {Object} metadata
 * @property {string} createdAt
 */

/**
 * @typedef {Object} DuplicatePair
 * @property {string} id
 * @property {string} reportId
 * @property {string} duplicateOf
 * @property {number} similarity
 * @property {{text: number, category: number, geo: number, time: number}} components
 * @property {DuplicateLevel} level
 * @property {DuplicateStatus} status
 * @property {string|null} reason
 * @property {string|null} reviewedAt
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Cluster
 * @property {string} key
 * @property {string} id
 * @property {string} label
 * @property {number} count
 * @property {Report[]} members
 * @property {Record<string, number>} categories
 * @property {number} avgPriority
 * @property {number} hotspotScore
 * @property {number} radiusMeters
 * @property {{latitude: number, longitude: number}} centroid
 * @property {'rising'|'steady'|'falling'} trend
 * @property {string} brief
 */

/**
 * @typedef {Object} ReportInput
 * @property {string} [title]
 * @property {string} description
 * @property {Category|'auto'} category
 * @property {string} [locationLabel]
 * @property {number} latitude
 * @property {number} longitude
 * @property {string|null} [imageUrl]
 * @property {string|null} [citizenId]
 */

export {};
