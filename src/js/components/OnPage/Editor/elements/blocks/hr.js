import React from 'react'
import Icon from '../../Toolbar/Icon'

export default {
  name: 'hr',
  icon: null, // <Icon size={24} path="M19 13H5v-2h14v2z" />,
  render: ({ attributes, children }) => <hr {...attributes} />,
  serialize: children => <hr />,
  deserialize: el => ({
    object: 'block',
    type: 'hr',
    data: {
      className: el.getAttribute('class'),
    },
  }),
  onButtonClick: editor => e => {
    e.preventDefault()
    const { value } = editor
    editor
      .moveToEndOfBlock()
      .insertBlock('hr')
      .insertBlock('paragraph')
  },
}
