import { Amplify } from 'aws-amplify'
import awsExports from '../aws-exports'

// Configure Amplify
Amplify.configure(awsExports)

export default Amplify