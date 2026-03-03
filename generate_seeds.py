import csv
import os

courses = [
    'BSIT', 'BSCS', 'BSBA', 'BSHM', 'BSTM', 'BSOA',
    'BSCrim', 'BSEd', 'BSPsych', 'BSA', 'BSEntrep', 'BSRealEstate', 'BSCustoms'
]

batch_year = '2024'
base_dir = r'c:\Users\Admin\Downloads\bcp-alumni-system\bcp-alumni-system\alumni_seeds'

if not os.path.exists(base_dir):
    os.makedirs(base_dir)

# Helper lists for fake names
first_names = ["Juan", "Maria", "Jose", "Ana", "Miguel", "Elena", "Rico", "Liza", "Pedro", "Sara"]
last_names = ["Dela Cruz", "Santos", "Reyes", "Pascual", "Bautista", "Garcia", "Lopez", "Villanueva", "Torres", "Aquino"]

for course in courses:
    filename = f"{course.lower().replace('/', '_')}_batch_{batch_year}.csv"
    filepath = os.path.join(base_dir, filename)
    
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['student_id', 'last_name', 'first_name', 'course', 'batch_year', 'email'])
        
        for i in range(1, 11):
            student_id = f"2024-{courses.index(course)+1:02d}-{i:04d}"
            fn = first_names[i-1]
            ln = last_names[i-1]
            email = f"{fn.lower()}.{ln.lower().replace(' ', '')}{i:02d}@alumni.bcp.edu.ph"
            writer.writerow([student_id, ln, fn, course, batch_year, email])

print(f"Generated 13 CSV files in {base_dir}")
