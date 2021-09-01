describe('imageSection', () => {
  beforeEach(() => {
    cy.sessionMock({ email: 'cypress@brickdoc.com' })
  })

  it('should embed image by inputting link', () => {
    cy.visit('/')
    cy.get('[contenteditable]').type('/image')
    cy.get('button.slash-menu-item:first').click()
    cy.findByText('Add an image').click()
    cy.findByPlaceholderText('Paste the image link...')
      .focus()
      .type(
        'https://images.unsplash.com/photo-1628189847457-b4607de7d222?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=564&q=80'
      )
    cy.findByText('Embed image').click()
    cy.get('.brickdoc-block-image').should('exist')
  })

  it('should upload image', () => {
    cy.visit('/')
    cy.get('[contenteditable]').type('/image')
    cy.get('button.slash-menu-item:first').click()
    cy.findByText('Add an image').click()
    cy.findByText('Upload').click()
    cy.get('input[type=file]').attachFile('images/test.png')
    cy.get('.brickdoc-block-image').should('exist')
  })

  it('should select image from Unsplash', () => {
    cy.visit('/')
    cy.get('[contenteditable]').type('/image')
    cy.get('button.slash-menu-item:first').click()
    cy.findByText('Add an image').click()
    cy.findByText('Unsplash').click()
    cy.get('.unsplash-image-item:first').click()
    cy.get('.brickdoc-block-image').should('exist')
  })

  it('should zoom in image when double click', () => {
    cy.visit('/')
    cy.get('[contenteditable]').type('/image')
    cy.get('button.slash-menu-item:first').click()
    cy.findByText('Add an image').click()
    const imageUrl =
      'https://images.unsplash.com/photo-1628189847457-b4607de7d222?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=564&q=80'
    cy.findByPlaceholderText('Paste the image link...').focus().type(imageUrl)
    cy.findByText('Embed image').click()
    cy.waitForResources(
      'https://images.unsplash.com/photo-1628189847457-b4607de7d222?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=564&q=80'
    )
    cy.get('.image-section-zoom-in-button').dblclick()
    cy.get('[aria-modal="true"] > button').should('exist').click().should('not.exist')
  })
})
