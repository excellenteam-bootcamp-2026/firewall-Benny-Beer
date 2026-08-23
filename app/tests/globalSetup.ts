import { populateMockData } from '../scripts/mock_data_population';

export default async function globalSetup(): Promise<void> {
  const counts = await populateMockData();
  const total = counts.ip + counts.domain + counts.port;
  console.log(`[globalSetup] Seeded ${total} rules: ${counts.ip} ip, ${counts.domain} domain, ${counts.port} port.`);
}
