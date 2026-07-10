/// <reference types="cypress" />

import {
  mockModerationReportsResponse,
  mockProfileResponse,
  mockRecordResponse,
  mockRepoResponse,
  SERVER_URL,
} from '../../support/api'

describe('Mod Action -> Label', () => {
  let authFixture
  let statusesFixture
  let seedFixture

  beforeEach(() => {
    cy.visit('http://127.0.0.1:3000')
    cy.fixture('statuses.json').then((data) => {
      statusesFixture = data
      mockModerationReportsResponse(statusesFixture.multiCidLabeledProfile)
    })
    cy.fixture('seed.json').then((data) => {
      seedFixture = data
      mockRepoResponse({
        statusCode: 200,
        body: seedFixture.carla.repo,
      })
      mockProfileResponse({
        statusCode: 200,
        body: seedFixture.carla.multiCidLabeledProfile,
      })
      mockRecordResponse({
        statusCode: 200,
        body: seedFixture.carla.multiCidLabeledProfile,
      })
    })

    cy.fixture('auth.json').then((data) => {
      authFixture = data
      cy.login(authFixture)
    })
  })

  it('Allows removing and adding a label to a subject', () => {
    const PORN_LABEL = 'porn'
    cy.get('table').should('include.text', seedFixture.carla.repo.handle)
    cy.contains('button', 'Take Action').click()
    cy.get('[data-cy="mod-event-selector"] button').click()
    cy.get('[data-headlessui-state="open"] > a:contains("Label")').click()
    cy.get('[data-cy="label-selector-buttons"] span')
      .contains(PORN_LABEL)
      .click()

    const requestedCids: string[] = []
    cy.intercept(
      'POST',
      `${SERVER_URL}/tools.ozone.moderation.emitEvent`,
      (req) => {
        requestedCids.push(req.body.subject.cid)
        expect(req.body.event.createLabelVals).to.be.empty
        expect(req.body.event.negateLabelVals).to.include(PORN_LABEL)
        req.reply({
          statusCode: 200,
          body: {
            id: requestedCids.length,
            event: req.body.event,
            subject: req.body.subject,
            subjectBlobCids: [],
            createdBy: 'did:plc:t7jaiidsmjzvtp7quvto4lo2',
            createdAt: '2024-05-13T18:40:13.196Z',
          },
        })
      },
    ).as('emitEvents')

    const labeledCids = seedFixture.carla.multiCidLabeledProfile.labels.map(
      ({ cid }) => cid,
    )
    cy.get('#mod-action-panel button[type="submit"]').click()
    cy.wrap(labeledCids).each(() => {
      cy.wait('@emitEvents')
    })

    // Validate that events were emitted for 2 different cids matching the exact number of labels added to different cids
    cy.then(() => {
      const uniqueRequestedCids = [...new Set(requestedCids)]
      const uniqueLabeledCids = [...new Set(labeledCids)]
      expect(uniqueRequestedCids).to.have.members(uniqueLabeledCids)
      expect(uniqueRequestedCids).to.have.lengthOf(uniqueLabeledCids.length)
    })
  })
})
