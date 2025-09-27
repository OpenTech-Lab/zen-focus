import { Amplify } from 'aws-amplify'
import outputs from '../../amplify_outputs.json'

// Configure Amplify for Gen2
Amplify.configure(outputs, {
  ssr: true, // Enable server-side rendering support
})

export default Amplify