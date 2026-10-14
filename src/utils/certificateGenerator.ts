import jsPDF from 'jspdf';

export interface DonationCertificateData {
  donorName: string;
  amount: number;
  campaignTitle: string;
  donationId: string;
  datePaid: string;
  paymentMethod?: string;
  transactionRef?: string;
}

/**
 * Generates an official landscape Certificate of Philanthropic Recognition and E-Receipt
 */
export const generateDonationCertificate = (data: DonationCertificateData) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297 x 210 mm
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // 1. Outer Background
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Dual Ornamental Borders (Navy & Gold)
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(202, 138, 4); // gold / amber-600
  doc.setLineWidth(0.8);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Corner Ornaments
  const cornerSize = 10;
  doc.setFillColor(202, 138, 4);
  doc.rect(10, 10, cornerSize, 2, 'F');
  doc.rect(10, 10, 2, cornerSize, 'F');
  doc.rect(pageWidth - 10 - cornerSize, 10, cornerSize, 2, 'F');
  doc.rect(pageWidth - 12, 10, 2, cornerSize, 'F');
  doc.rect(10, pageHeight - 12, cornerSize, 2, 'F');
  doc.rect(10, pageHeight - 10 - cornerSize, 2, cornerSize, 'F');
  doc.rect(pageWidth - 10 - cornerSize, pageHeight - 12, cornerSize, 2, 'F');
  doc.rect(pageWidth - 12, pageHeight - 10 - cornerSize, 2, cornerSize, 'F');

  // 3. Header Ribbon & School Name
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(40, 18, pageWidth - 80, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BESTLINK COLLEGE OF THE PHILIPPINES', pageWidth / 2, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICE OF ALUMNI RELATIONS & INSTITUTIONAL ADVANCEMENT', pageWidth / 2, 30.5, { align: 'center' });

  // 4. Certificate Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CERTIFICATE OF DONATION', pageWidth / 2, 50, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(202, 138, 4); // gold
  doc.text('PHILANTHROPIC PARTNERSHIP & BENEFACTOR RECOGNITION', pageWidth / 2, 57, { align: 'center' });

  // 5. Presentation Text
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('This official certificate of appreciation is proudly and gratefully conferred upon:', pageWidth / 2, 69, { align: 'center' });

  // 6. Recipient Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(data.donorName.toUpperCase(), pageWidth / 2, 83, { align: 'center' });

  // Underline for recipient
  const nameWidth = doc.getTextWidth(data.donorName.toUpperCase());
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - nameWidth / 2 - 10, 86, pageWidth / 2 + nameWidth / 2 + 10, 86);

  // 7. Citation Text
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  const citationLine1 = `In high esteem and sincere recognition of their distinguished philanthropic gift in the amount of`;
  const citationAmount = `PHP ${Number(data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const citationLine2 = `dedicated towards the advocacy: "${data.campaignTitle}".`;
  const citationLine3 = `Your generous support empowers future generations of students and strengthens our alma mater's enduring mission.`;

  doc.text(citationLine1, pageWidth / 2, 97, { align: 'center' });

  doc.setFont('helvetica', 'black');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(citationAmount, pageWidth / 2, 105, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(citationLine2, pageWidth / 2, 114, { align: 'center' });
  doc.text(citationLine3, pageWidth / 2, 121, { align: 'center' });

  // 8. Official Receipt & Acknowledgment Box (Left side)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(25, 135, 95, 45, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(25, 135, 95, 45, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('OFFICIAL CONTRIBUTION VOUCHER', 30, 142);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Receipt Serial: BCP-DON-${data.donationId.slice(0, 8).toUpperCase()}`, 30, 149);
  doc.text(`Date Verified: ${data.datePaid}`, 30, 155);
  doc.text(`Payment Gateway: ${data.paymentMethod || 'Official Gateway / Bank'}`, 30, 161);
  doc.text(`Beneficiary: Bestlink College Student Fund`, 30, 167);
  doc.text(`Tax Deductible: Verified Educational Gift`, 30, 173);

  // 9. Signatures Block (Right side)
  const sigY = 162;

  // Signature 1: Alumni Director
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.5);
  doc.line(145, sigY, 195, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ATTY. MARIA CHARLOTTE REYES', 170, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Director, Alumni Affairs & Institutional Giving', 170, sigY + 9, { align: 'center' });

  // Signature 2: College President
  doc.line(220, sigY, 270, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DR. VICENTE C. BESTLINK, PhD', 245, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('President & Chief Executive Officer', 245, sigY + 9, { align: 'center' });

  // 10. Seal & Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Secure Document Reference: ${data.donationId} • Issued via Bestlink College Alumni Portal • Verified Official Record`, pageWidth / 2, 195, { align: 'center' });

  // Save PDF
  const filename = `Certificate_of_Donation_${data.donorName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
