/// <reference types="Cypress" />

describe('The day view', () => {
  beforeEach(() => {
    cy.visit('/?wipeDbAndSeedTestData')
    cy.contains('Email')  // Wait for the last timebox to be added.
  })

  it('displays the timeboxes for today', () => {
    cy.visit('/')
    cy.contains('Aufsatz zur Verwandlung von Pangolinen')
    cy.get('article h4').should('have.length', 3)
  })

  it('allows opening and moving draft TBs by clicking the agenda', () => {
    let boxPos;
    // Click outside an existing timebox
    cy.get('.agenda').click(0, 600)
    cy.get('.timebox-draft').should(($timeboxDraft) => {
      boxPos = $timeboxDraft.position().top;
    });
    cy.get('.timebox-draft textarea').should('have.focus');

    // Clicking elsewhere (also outside existing timebox) should move the box
    cy.get('.agenda').click(0, 630)
    cy.get('.timebox-draft').should('have.length', 1)
    cy.get('.timebox-draft').should(($timeboxDraft) => {
      let newPos = $timeboxDraft.position().top;
      expect(newPos).to.equal(boxPos + 30);
      boxPos = newPos;
    })
    cy.get('.timebox-draft textarea').should('have.focus')

    // Click inside the draft timebox should do nothing
    cy.get('.timebox-draft').click().should(($timeboxDraft) => {
      expect($timeboxDraft.position().top).to.equal(boxPos)
    })

    // Editing the timebox, then clicking outside should flash the box
    cy.get('.timebox-draft textarea').type('deeeeeep work')
    cy.get('.agenda').click(0, 600)
    cy.get('.timebox-draft').should('have.class', 'box-flash')

    // Clicking (x) should close the box
    cy.get('.timebox-draft .closeBtn').click()
    cy.get('.timebox-draft').should('have.length', 0)

    // Hitting [esc] should close the box
    cy.get('.agenda').click(0, 630)
    cy.get('.timebox-draft textarea').type('deeeeeep work{esc}')
    cy.get('.timebox-draft').should('have.length', 0)

    // Hitting [return] in an empty box should do nothing
    cy.get('.agenda').click(0, 630)
    cy.get('.timebox-draft textarea').type('{enter}')
    cy.get('.timebox-draft').should('have.length', 1)

    // Trying to add a TB over an existing one should fail
    cy.get('.agenda').click(0, 480)
    cy.get('.timebox-draft').should('have.length', 1)
    cy.get('.timebox-draft textarea').type('deeeeeep work{enter}')
    cy.get('.timebox-draft').should('have.class', 'box-flash')
    cy.get('.timebox-draft').should('have.length', 1)
    cy.get('.notifications p').should('have.length', 1)
  })
})
