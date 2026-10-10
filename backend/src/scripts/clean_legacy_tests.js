import { prisma } from '../config/db.js';
async function main() {
    const deleted = await prisma.test.deleteMany({
        where: {
            slug: { startsWith: 'diagnostic-test-' },
        },
    });
    console.log(`Deleted ${deleted.count} legacy diagnostic test records.`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
