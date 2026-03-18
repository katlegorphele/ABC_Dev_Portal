import { Cohort } from '../models/Cohort'
import { Lesson } from '../models/Lesson'

const CURRICULUM = [
  { week: 1,  title: 'Blockchain Fundamentals',   objectives: ['What is blockchain?','Consensus mechanisms','Cryptography basics','Wallets & keys'] },
  { week: 2,  title: 'Transactions & Gas',         objectives: ['How transactions work','Gas & fees','EVM architecture','Testnets & faucets'] },
  { week: 3,  title: 'Solidity Data Types',        objectives: ['Value types','Reference types','Mappings & structs','When to use each type'] },
  { week: 4,  title: 'Functions & Modifiers',      objectives: ['Visibility','State mutability','Custom modifiers','Access control patterns'] },
  { week: 5,  title: 'Smart Contract Patterns',    objectives: ['Ownable','ReentrancyGuard','Pausable','Checks-Effects-Interactions'] },
  { week: 6,  title: 'ERC-20 Tokens',              objectives: ['Token standard','Mint & burn','Allowances','Build a community token'] },
  { week: 7,  title: 'ERC-721 NFTs',               objectives: ['NFT standard','Metadata','IPFS storage','Build an NFT collection'] },
  { week: 8,  title: 'Testing with Hardhat',       objectives: ['Unit tests','Integration tests','Gas reporting','Test coverage'] },
  { week: 9,  title: 'Security & Auditing',        objectives: ['Common vulnerabilities','Reentrancy','Oracle manipulation','Audit checklist'] },
  { week: 10, title: 'Frontend Integration',       objectives: ['ethers.js / viem','Wallet connections','Reading contracts','Writing transactions'] },
  { week: 11, title: 'DeFi Fundamentals',          objectives: ['AMMs','Liquidity pools','Staking','African DeFi use cases'] },
  { week: 12, title: 'DAOs & Governance',          objectives: ['Governance tokens','Voting mechanisms','Timelock','Build a DAO'] },
  { week: 13, title: 'Oracles & Chainlink',        objectives: ['Why oracles?','Chainlink VRF','Price feeds','Randomness in contracts'] },
  { week: 14, title: 'Production Deployment',      objectives: ['Mainnet checklist','Contract verification','Monitoring','Incident response'] },
  { week: 15, title: 'Capstone Planning',          objectives: ['Project scoping','Architecture design','Team formation','Pitch prep'] },
  { week: 16, title: 'Capstone Presentations',     objectives: ['Live demos','Code review','Security assessment','Commercial readiness'] },
]

export async function seedDefaults() {
  // Create default cohort if none exists
  let cohort = await Cohort.findOne({ status: 'active' })
  if (!cohort) {
    cohort = await Cohort.create({
      name:       'Cohort 01 — 2026',
      start_date: new Date(),
      status:     'active',
    })
    console.log('🌱 Seeded default cohort')
  }

  // Seed curriculum lessons if none exist for this cohort
  const lessonCount = await Lesson.countDocuments({ cohort: cohort._id })
  if (lessonCount === 0) {
    await Lesson.insertMany(
      CURRICULUM.map(l => ({ ...l, cohort: cohort!._id, status: 'scheduled' }))
    )
    console.log(`🌱 Seeded ${CURRICULUM.length} lessons for ${cohort.name}`)
  }
}
