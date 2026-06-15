import React from 'react'

export default function Input(props) {
  return (
    <input {...props} className={`px-3 py-2 border rounded-md w-full ${props.className || ''}`} />
  )
}
