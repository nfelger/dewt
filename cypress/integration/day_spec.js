/// <reference types="Cypress" />

import { iso8601date } from "../../src/helpers"

const coords = {
  outsideExistingTb: [0, 600],                   // 600 = 10 hours from day start => 16:00
  outsideExistingTbPlusHalfHour: [0, 630],
  overlappingExistingTbButOutsideBox: [0, 240],  // 240 => 10:00, there's a test event from 12:45 to 15:00
  insideExistingTb: [100, 240]
}

function reset() {
  // Wipe and reseed test timeboxes.
  cy.visit('/?wipeDbAndSeedTestData')
    .contains('Email')  // Wait for all to be added.
}

describe('The day view', () => {
  before(reset)

  beforeEach(() => {
    // Refresh the page and wait for timeboxes to be rendered.
    cy.visit('/')
      .contains('Email')
  })

  it('should display timeboxes for today', () => {
    // Show the 3 timeboxes for today, incl one about pangolins.
    cy.get('article h4')
      .should('have.length', 3)
      .contains('Aufsatz zur Verwandlung von Pangolinen')
  })

  describe('adding TBs', () => {
    after(reset)

    it('should allow opening and moving draft TBs by clicking the agenda', () => {
      // Clicking outside an existing timebox should open a draft and focus its textarea
      cy.get('.agenda')
        .click(...coords.outsideExistingTb)

      cy.get('.timebox-draft textarea')
        .should('have.focus')

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
        .click(...coords.overlappingExistingTbButOutsideBox)

      cy.get('.timebox-draft')
        .should('exist')
        .find('textarea')
        .type('deeeeeep work{enter}')

      cy.get('.timebox-draft')
        .should('have.class', 'box-flash')

      cy.get('.notifications p')
        .should('have.length', 1)
    })

    it('should allow adding a TB', () => {
      cy.get('.agenda')
        .click(...coords.outsideExistingTb)

      cy.get('.timebox-draft textarea')
        .type('deeeeeep work{enter}')

      cy.get('article h4')
        .contains('deeeeeep work')
    })

    it('should use date of the current view for the TB', () => {
      cy.visit('/?date=2020-01-01')

      // Add a timebox.
      cy.get('.agenda')
        .click(0, 300)  // Time doesn't matter for this test...

      cy.get('.timebox-draft textarea')
        .type('deeeeeep work{enter}')

      // It should show on the current view.
      cy.get('article h4')
        .contains('deeeeeep work')
        .click()

      // And it should have the correct date.
      cy.get('.timebox-edit [name=date]')
        .should('have.value', '2020-01-01')
    })
  })

  describe('editing TBs', () => {
    beforeEach(() => {
      // Open an edit modal for the pangolin timebox.
      cy.get('.agenda')
        .click(...coords.insideExistingTb)
    })

    after(reset)

    it('clicking on a TB should open an edit form', () => {
      cy.get('.timebox-edit')
        .should('exist')
    })

    it('should have the correct data prefilled', () => {
      cy.get('.timebox-edit').within(() => {
        cy.get('[name=project]').should('have.value', 'writing')
        cy.get('[name=details]').should('have.value', 'Aufsatz zur Verwandlung von Pangolinen')
        cy.get('[name=start-minute]').should('have.value', '09:30')
        cy.get('[name=end-minute]').should('have.value', '11:10')
        cy.get('[name=date]').should('have.value', iso8601date(new Date()))
        cy.get('[name=theme-color]').should('have.value', '1')
      })
    })

    it('making changes and submitting the form should update the TB', () => {
      // Change values.
      cy.get('[name=project]').clear().type('research')
      cy.get('[name=details]').clear().type('was sind Pangoline')
      cy.get('[name=start-minute]').clear().type('8:30')  // => (8-6)*60 + 30 = 150
      cy.get('[name=end-minute]').clear().type('11:15')   // => (11-6)*60 + 15 = 315
      cy.get('[name=theme-color]').clear().type('2')

      // Submit form.
      cy.get('.timebox-edit')
        .contains('Save')
        .click()

      // Timebox properties and location should have updated.
      cy.get('article')
        .contains('research')
        .parent()
        .contains('was sind Pangoline')
        .parent()
        .should('have.class', 'theme-color-2')
        .should('have.css', 'grid-row-start', '151')
        .should('have.css', 'grid-row-end', '316')
    })

    it('changing the TB to overlap with another should cause a validation error', () => {
      // Change times to overlap another test event.
      cy.get('[name=start-minute]').clear().type('12:00')
      cy.get('[name=end-minute]').clear().type('13:00')

      // Submit.
      cy.get('.timebox-edit')
        .contains('Save')
        .click()

      // Edit modal should flash an error.
      cy.get('.timebox-edit')
        .should('have.class', 'box-flash')

      // Notifications area should have an error message.
      cy.get('.notifications p')
        .should('have.length', 1)
    })

    it('should forget edits after closing the modal', () => {
      // Change details value.
      cy.get('[name=details]').clear().type('GARBLEBARF')

      // Close the modal, discarding changes.
      cy.get('.timebox-edit')
        .contains('Cancel')
        .click()

      // Reopen the modal: value should reset to what was saved.
      cy.get('.agenda')
        .click(...coords.insideExistingTb)
        .should('not.contain', 'GARBLEBARF')
        .contains('was sind Pangoline')
    })

    it('validation: required fields', () => {
      // Project may be blank
      cy.get('[name=project]').clear().blur()
      cy.get('input:invalid').should('have.length', 0)

      // All other fields may not
      cy.get('[name=details]').clear().blur()
      cy.get('[name=start-minute]').clear().blur()
      cy.get('[name=end-minute]').clear().blur()
      cy.get('[name=date]').clear().blur()
      cy.get('[name=theme-color]').clear().blur()
      cy.get('input:invalid').should('have.length', 5)
    })

    it('validation: times and date', () => {
      // Missing colon
      cy.get('[name=start-minute]').clear().type('0630').blur()
      cy.get('[name=end-minute]').clear().type('0930').blur()
      cy.get('input:invalid').should('have.length', 2)

      // Invalid hour / minute
      cy.get('[name=start-minute]').clear().type('12:60').blur()
      cy.get('[name=end-minute]').clear().type('24:00').blur()
      cy.get('input:invalid').should('have.length', 2)

      // Missing digit
      cy.get('[name=start-minute]').clear().type('11:6').blur()
      cy.get('[name=end-minute]').clear().type('12:0').blur()
      cy.get('input:invalid').should('have.length', 2)

      // End before start
      cy.get('[name=start-minute]').clear().type('09:30').blur()
      cy.get('[name=end-minute]').clear().type('08:00').blur()
      cy.get('input:invalid').should('have.length', 2)

      // Without leading zero: valid
      cy.get('[name=start-minute]').clear().type('6:30').blur()
      cy.get('[name=end-minute]').clear().type('9:30').blur()
      cy.get('input:invalid').should('have.length', 0)

      // With leading zero: valid
      cy.get('[name=start-minute]').clear().type('06:30').blur()
      cy.get('[name=end-minute]').clear().type('09:30').blur()
      cy.get('input:invalid').should('have.length', 0)

      // Valid date format
      cy.get('[name=date]').clear().type('2020-05-30').blur()
      cy.get('input:invalid').should('have.length', 0)

      // Invalid date format
      cy.get('[name=date]').clear().type('2020-1-12').blur()
      cy.get('input:invalid').should('have.length', 1)
    })

    it('validation: theme color must be in range [1, 7]', () => {
      cy.get('[name=theme-color]').clear().type('3').blur()
      cy.get('input:invalid').should('have.length', 0)

      cy.get('[name=theme-color]').clear().type('8').blur()
      cy.get('input:invalid').should('have.length', 1)

      cy.get('[name=theme-color]').clear().type('0').blur()
      cy.get('input:invalid').should('have.length', 1)
    })

    it('changing the date should remove the TB from view', () => {
      // Change date to some time in the past.
      cy.get('[name=date]').clear().type('2020-01-01')

      // Submit.
      cy.get('.timebox-edit')
        .contains('Save')
        .click()

      // Timebox should disappear.
      cy.get('article')
        .contains('Pangolin')
        .should('not.exist')
    })
  })

  describe('deleting TBs', () => {
    after(reset)

    it('should remove a TB', () => {
      // Open an edit modal.
      cy.get('.agenda')
        .click(...coords.insideExistingTb)

      // Click 'Delete'.
      cy.get('.timebox-edit')
        .contains('Delete')
        .click()

      // Timebox should disappear.
      cy.get('article')
        .contains('Pangolin')
        .should('not.exist')
    })
  })

  describe('work hours', () => {
    it('should default to 8:00 – 18:00', () => {
      cy.get('.work-hours')
        .should('have.css', 'grid-row-start', '121')
        .should('have.css', 'grid-row-end', '721')
    })

    it('should allow changing the hours', () => {
      // Open the work hours modal.
      cy.get('.agenda')
        .contains('Set work hours')
        .click()

      // Change values.
      cy.get('.work-hours-modal [name=start]').clear().type('11:00')
      cy.get('.work-hours-modal [name=end]').clear().type('22:00')

      // Submit.
      cy.get('.work-hours-modal')
        .contains('Save')
        .click()

      // Work hours overlay should change.
      cy.get('.work-hours')
        .should('have.css', 'grid-row-start', '301')
        .should('have.css', 'grid-row-end', '961')
    })
  })
})
