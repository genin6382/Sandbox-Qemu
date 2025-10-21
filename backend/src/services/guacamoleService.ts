/**File to establish Guacamole connection */
import axios from 'axios';
import dotenv from 'dotenv'
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');

dotenv.config({ path: envPath });

const GUACAMOLE_URL = (process.env.GUACAMOLE_URL);
const GUACAMOLE_DATASOURCE = (process.env.GUACAMOLE_DATASOURCE );
const GUACAMOLE_USERNAME = (process.env.GUACAMOLE_USERNAME );
const GUACAMOLE_PASSWORD = (process.env.GUACAMOLE_PASSWORD );

let cachedAuthToken: string | null = null;
let tokenExpiry: number = 0;

/**Get Guacamole Auth token to establish connection */
export async function getAuthToken() {
    if (cachedAuthToken && Date.now() < tokenExpiry) {
      return cachedAuthToken;
    }
    try {
      const response = await axios.post(
        `${GUACAMOLE_URL}/api/tokens`,
        `username=${GUACAMOLE_USERNAME}&password=${GUACAMOLE_PASSWORD}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      cachedAuthToken = response.data.authToken;
      tokenExpiry = Date.now() + 10 * 60 * 1000; // cache for 10 minutes
      return cachedAuthToken;
    } 
    catch (error: any) {
      console.error('Guacamole auth failed:', error.response?.data || error.message);
      throw new Error('Guacamole authentication failed');
    }
}
/**Creates a new Guacamole VNC connection for a given node by calling the Guacamole REST API */
export async function createVNCConnection(nodeName: string, vncPort: number) {
    const token = await getAuthToken();
    const url = `${GUACAMOLE_URL}/api/session/data/${GUACAMOLE_DATASOURCE}/connections?token=${token}`;

    const connectionData = {
      parentIdentifier: 'ROOT',
      name: nodeName,
      protocol: 'vnc',
      attributes: {},  
      parameters: {
        hostname: 'host.docker.internal',  
        port: vncPort.toString(),
        autoretry: '5',
        password: '',
        'color-depth': '24',
        'resize-method': 'display-update',
        'ignore-cert': 'true',
        'enable-sftp': 'false',
        'enable-drive': 'false',
      },
    };

    try {
      const response = await axios.post(url, connectionData, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Guac Connection ID:', response.data.identifier);
      return response.data.identifier;
    } catch (error: any) {
      console.error('Guacamole API error:', error.response?.data || error.message);
      throw new Error('Failed to create Guacamole connection');
    }
}
/**Generates a Guacamole client URL using the given connection ID by encoding */
export function generateConnectionURL(connectionId: string): string {
  const connectionString = `${connectionId}\x00c\x00${GUACAMOLE_DATASOURCE}`;
  const encodedString = Buffer.from(connectionString).toString('base64');
  return `${GUACAMOLE_URL}/#/client/${encodedString}`;
}
/** Deletes an existing Guacamole connection by sending a DELETE request to the Guacamole REST API using the connection ID. */
export async function deleteConnection(connectionId: string): Promise<void> {
  try {
    const token = await getAuthToken();
    await axios.delete(
      `${GUACAMOLE_URL}/api/session/data/${GUACAMOLE_DATASOURCE}/connections/${connectionId}?token=${token}`
    );
    console.log('Guacamole connection deleted:', connectionId);
  } catch (error: any) {
    console.error('Failed to delete Guacamole connection:', error.response?.data || error.message);
    throw new Error('Failed to delete Guacamole connection');
  }
}
