import { describe, expect, it } from 'vitest'

import { reconcileSelectedLabelsWithDefaults } from './Selector'

describe('reconcileSelectedLabelsWithDefaults', () => {
  it('hydrates selected labels when async defaults arrive before edits', () => {
    expect(
      reconcileSelectedLabelsWithDefaults({
        currentLabels: [],
        previousDefaultLabels: [],
        nextDefaultLabels: ['porn', 'porn'],
      }),
    ).toEqual(['porn', 'porn'])
  })

  it('preserves moderator edits after defaults change', () => {
    expect(
      reconcileSelectedLabelsWithDefaults({
        currentLabels: ['nudity'],
        previousDefaultLabels: [],
        nextDefaultLabels: ['impersonation'],
      }),
    ).toEqual(['nudity'])
  })

  it('keeps equal current labels by reference when defaults are unchanged', () => {
    const currentLabels = ['impersonation']

    expect(
      reconcileSelectedLabelsWithDefaults({
        currentLabels,
        previousDefaultLabels: ['impersonation'],
        nextDefaultLabels: ['impersonation'],
      }),
    ).toBe(currentLabels)
  })
})
