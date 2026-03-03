import fs from 'fs';
import path from 'path';

const courses = [
    'BSIT', 'BSCS', 'BSBA', 'BSHM', 'BSTM', 'BSOA',
    'BSCrim', 'BSEd', 'BSPsych', 'BSA', 'BSEntrep', 'BSRealEstate', 'BSCustoms'
];

const batch_year = '2024';
const baseDir = path.join('c:', 'Users', 'Admin', 'Downloads', 'bcp-alumni-system', 'bcp-alumni-system', 'alumni_seeds');

if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

// Large pool of names for uniqueness
const firstNamesPool = [
    "Aaron", "Abigail", "Adam", "Adrian", "Aileen", "Al", "Albert", "Alex", "Alexander", "Alfred", "Alice", "Alicia", "Allen", "Alma", "Alvin", "Amanda", "Amber", "Amy", "Andrea", "Andrew",
    "Angela", "Anita", "Ann", "Anna", "Anne", "Anthony", "Antonio", "Arlene", "Arthur", "Ashley", "Audrey", "Barbara", "Barry", "Beatrice", "Becky", "Belinda", "Benjamin", "Bernadette", "Bernard", "Bernice",
    "Bertha", "Bessie", "Beth", "Betty", "Beverly", "Bill", "Billie", "Billy", "Blanche", "Bob", "Bobbie", "Bobby", "Bonnie", "Brad", "Bradley", "Brandon", "Brenda", "Brent", "Brett", "Brian",
    "Bridget", "Britney", "Brittany", "Bruce", "Bryan", "Byron", "Calvin", "Camilla", "Candace", "Carl", "Carla", "Carlos", "Carmen", "Carol", "Carole", "Caroline", "Carolyn", "Carrie", "Casey", "Cassandra",
    "Catherine", "Cathy", "Cecil", "Cecilia", "Celia", "Chad", "Charlene", "Charles", "Charlie", "Charlotte", "Cheryl", "Chester", "Chloe", "Chris", "Christian", "Christina", "Christine", "Christopher", "Christy", "Cindy",
    "Claire", "Clara", "Clarence", "Claude", "Claudia", "Clayton", "Clifford", "Clifton", "Clinton", "Clyde", "Cody", "Colleen", "Connie", "Conrad", "Constance", "Cora", "Corey", "Cory", "Courtney", "Craig",
    "Cristina", "Crystal", "Curtis", "Cynthia", "Daisy", "Dale", "Dallas", "Dan", "Dana", "Daniel", "Danielle", "Danny", "Daphne", "Darin", "Darlene", "Darrell", "Darren"
];

const lastNamesPool = [
    "Abbott", "Adams", "Adkins", "Aguilar", "Alford", "Allen", "Allison", "Alston", "Alvarado", "Alvarez", "Anderson", "Andrews", "Anthony", "Armstrong", "Arnold", "凡shley", "Atkins", "Atkinson", "Austin", "Avery",
    "Ayala", "Ayers", "Bailey", "Baird", "Baker", "Baldwin", "Ball", "Ballard", "Banks", "Barber", "Barker", "Barlow", "Barnard", "Barnes", "Barnett", "Barr", "Barrera", "Barrett", "Barron", "Barry",
    "Bartlett", "Barton", "Bass", "Bates", "Battle", "Bauer", "Baxter", "Beach", "Bean", "Beard", "Beasley", "Beck", "Becker", "Bell", "Bender", "Benjamin", "Bennett", "Benson", "Bentley", "Benton",
    "Berg", "Berger", "Bernard", "Berry", "Best", "Bird", "Bishop", "Black", "Blackburn", "Blackwell", "Blair", "Blake", "Blanchard", "Blankenship", "Blevins", "Bliss", "Block", "Blount", "Blue", "Blum",
    "Bobo", "Bogan", "Boggs", "Bolan", "Boling", "Bolton", "Bond", "Bonds", "Bonner", "Booker", "Boone", "Booth", "Boothe", "Borden", "Borders", "Boren", "Bost", "Bostic", "Bostick", "Boston",
    "Botts", "Boucher", "Bouldin", "Bounds", "Bourne", "Bowden", "Bowen", "Bowers", "Bowles", "Bowling", "Bowman", "Boyce", "Boyd", "Boyer", "Boykin", "Boyles", "Boynton", "Bozeman", "Brackett", "Bradbury",
    "Bradford", "Bradley", "Bradshaw", "Brady", "Bragg", "Branch", "Brandt", "Branham", "Brannon", "Brantley", "Brashears", "Braswell", "Bratton", "Bray", "Breaux", "Breckenridge", "Breen", "Brennan", "Brewer", "Brewster"
];

// Shuffle names pools to get random combinations
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

shuffle(firstNamesPool);
shuffle(lastNamesPool);

let nameIndex = 0;
const allRows = [['student_id', 'last_name', 'first_name', 'course', 'batch_year', 'email']];

courses.forEach((course, courseIdx) => {
    const courseRows = [['student_id', 'last_name', 'first_name', 'course', 'batch_year', 'email']];
    for (let i = 1; i <= 10; i++) {
        const student_id = `2024-${(courseIdx + 1).toString().padStart(2, '0')}-${i.toString().padStart(4, '0')}`;

        // Use unique name from pool
        const fn = firstNamesPool[nameIndex % firstNamesPool.length];
        const ln = lastNamesPool[nameIndex % lastNamesPool.length];
        nameIndex++;

        const email = `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s/g, '')}${i.toString().padStart(2, '0')}@alumni.bcp.edu.ph`;

        const row = [student_id, ln, fn, course, batch_year, email];
        allRows.push(row);
        courseRows.push(row);
    }

    const courseCsvContent = courseRows.map(r => r.join(',')).join('\n');
    const coursePath = path.join(baseDir, `${course.toLowerCase().replace('/', '_')}_batch_${batch_year}.csv`);
    fs.writeFileSync(coursePath, courseCsvContent);
});

const combinedCsvContent = allRows.map(r => r.join(',')).join('\n');
const combinedPath = path.join(baseDir, 'all_alumni_batch_2024_unique_130.csv');
fs.writeFileSync(combinedPath, combinedCsvContent);

console.log(`Regenerated 13 course CSVs and 1 combined CSV in ${baseDir}`);
console.log(`Total unique profiles generated: ${nameIndex}`);
