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

// Helper lists for fake names
const first_names = ["Juan", "Maria", "Jose", "Ana", "Miguel", "Elena", "Rico", "Liza", "Pedro", "Sara"];
const last_names = ["Dela Cruz", "Santos", "Reyes", "Pascual", "Bautista", "Garcia", "Lopez", "Villanueva", "Torres", "Aquino"];

courses.forEach((course, courseIdx) => {
    const filename = `${course.toLowerCase().replace('/', '_')}_batch_${batch_year}.csv`;
    const filePath = path.join(baseDir, filename);

    const rows = [['student_id', 'last_name', 'first_name', 'course', 'batch_year', 'email']];

    for (let i = 1; i <= 10; i++) {
        const student_id = `2024-${(courseIdx + 1).toString().padStart(2, '0')}-${i.toString().padStart(4, '0')}`;
        const fn = first_names[i - 1];
        const ln = last_names[i - 1];
        const email = `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s/g, '')}${i.toString().padStart(2, '0')}@alumni.bcp.edu.ph`;
        rows.push([student_id, ln, fn, course, batch_year, email]);
    }

    const csvContent = rows.map(r => r.join(',')).join('\n');
    fs.writeFileSync(filePath, csvContent);
});

console.log(`Generated 13 CSV files in ${baseDir}`);
