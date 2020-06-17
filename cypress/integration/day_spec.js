/// <reference types="Cypress" />

const coords = {
  outsideExistingTb: [0, 600],                   // 600 = 10 hours from day start => 16:00
  outsideExistingTbPlusHalfHour: [0, 630],
  overlappingExistingTbButOutsideBox: [0, 480],  //
}

describe('The day view', () => {
  beforeEach(() => {
    cy.visit('/?wipeDbAndSeedTestData')
      // Wait for the last timebox to be added.
      .contains('Email')
  })

  it('displays the timeboxes for today', () => {
    cy.visit('/')

    cy.get('article h4')
      .should('have.length', 3)  // Show the 3 timeboxes for today.
      .contains('Aufsatz zur Verwandlung von Pangolinen')
  })

  it('allows opening and moving draft TBs by clicking the agenda', () => {
    // Clicking outside an existing timebox should open a draft and focus its textarea
    cy.get('.agenda')
      .click(...coords.outsideExistingTb)

    cy.get('.timebox-draft textarea')
      .should('have.focus');

    // Clicking elsewhere (also outside existing timebox) should move the box
    cy.get('.agenda')
      .click(...coords.outsideExistingTbPlusHalfHour)

    cy.get('.timebox-draft')
      .should('exist')
      .invoke('position')
      .its('top')
      .should('eq', coords.outsideExistingTbPlusHalfHour[1])

    cy.get('.timebox-draft textarea')
      .should('have.focus')

    // Clicking inside the draft timebox should do nothing
    cy.get('.timebox-draft')
      .click()
      .invoke('position')
      .its('top')
      .should('eq', coords.outsideExistingTbPlusHalfHour[1])

    // Editing the timebox, then clicking outside should flash the box
    cy.get('.timebox-draft textarea')
      .type('deeeeeep work')

    cy.get('.agenda')
      .click(...coords.outsideExistingTb)

    cy.get('.timebox-draft')
      .should('have.class', 'box-flash')

    // Clicking (x) should close the box
    cy.get('.timebox-draft .closeBtn')
      .click()

    cy.get('.timebox-draft')
      .should('not.exist')

    // Hitting [esc] should close the box
    cy.get('.agenda')
      .click(...coords.outsideExistingTb)

    cy.get('.timebox-draft textarea')
      .type('deeeeeep work{esc}')

    cy.get('.timebox-draft')
      .should('not.exist')

    // Hitting [return] in an empty box should do nothing
    cy.get('.agenda')
      .click(...coords.outsideExistingTb)

    cy.get('.timebox-draft textarea')
      .type('{enter}')

    cy.get('.timebox-draft')
      .should('exist')

    // Trying to add a TB over an existing one should fail
    cy.get('.agenda')
      .click(...coords.overlappingExistingTbButOutsideBox)  // 480 = 14:00, there's a test event from 12:45 to 15:00

    cy.get('.timebox-draft')
      .should('exist')
      .find('textarea')
      .type('deeeeeep work{enter}')

    cy.get('.timebox-draft')
      .should('have.class', 'box-flash')

    cy.get('.notifications p')
      .should('have.length', 1)
  })
})
