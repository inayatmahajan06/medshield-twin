"""
PDF Forensic Report Generator Module (reports/generator.py)
-----------------------------------------------------------
Purpose: Uses the ReportLab library to programmatically generate a professional, formatted
         PDF report of the hospital's security and telemetry state.
Why: Security analysts need exportable, printable audit logs for forensic documentation and compliance reviews.
"""

import os
import sys
from datetime import datetime

# ReportLab libraries
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Adjust paths to import database manager and blockchain
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database.db_manager import get_devices, get_alerts, get_logs
from blockchain.blockchain import Blockchain

def generate_security_report(output_path, generated_by="Security Analyst"):
    """
    Purpose: Compile hospital telemetry and cryptographic logs and export a professional PDF.
    Input: output_path (str) - target path for the PDF file
           generated_by (str) - username or role of the generator
    Output: Path to the generated PDF
    Logic: 1. Fetch devices, alerts, and logs from SQLite.
           2. Execute a live Blockchain verification.
           3. Setup ReportLab Document and styling sheets.
           4. Construct document Flowables (paragraphs, spacers, styled tables).
           5. Build the PDF.
    """
    # 1. Fetch data
    devices = get_devices()
    alerts = get_alerts(20)
    
    # 2. Audit blockchain
    bc = Blockchain()
    audit_results = bc.verify_chain()
    blockchain_status = "SECURE / VERIFIED" if audit_results["status"] == "Valid" else "WARNING / TAMPERED"
    
    # 3. Setup document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E3A8A'), # Deep Blue
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563'), # Gray
        spaceAfter=20
    )
    
    heading2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0F172A'), # Charcoal
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    
    bold_body_style = ParagraphStyle(
        'ReportBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    # --- Header / Banner ---
    story.append(Paragraph("MedShield Twin", title_style))
    story.append(Paragraph(f"AI-Powered Smart Hospital Security Audit Report | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} by {generated_by}", subtitle_style))
    
    # Divider
    divider = Table([[""]], colWidths=[500], rowHeights=[2])
    divider.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#3B82F6')),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 15))
    
    # --- Section 1: Executive Summary ---
    story.append(Paragraph("1. Executive Security Summary", heading2_style))
    
    online_count = sum(1 for d in devices if d["status"] == "Online" or d["status"] == "Safe")
    attack_count = sum(1 for d in devices if d["status"] == "Under Attack")
    offline_count = sum(1 for d in devices if d["status"] == "Offline")
    
    summary_text = (
        f"This security report provides a cryptographic and analytical evaluation of the <b>MedShield Twin</b> digital "
        f"hospital infrastructure. The twin currently monitors <b>{len(devices)}</b> active Internet of Medical Things (IoMT) devices "
        f"distributed across clinical departments. Currently, <b>{online_count}</b> devices are functioning normally, "
        f"<b>{attack_count}</b> are flagged under active AI cyber-threat warnings, and <b>{offline_count}</b> are powered down or "
        f"disconnected. Cryptographic verification of historical records reports the system blockchain is in a <b>{blockchain_status}</b> state."
    )
    story.append(Paragraph(summary_text, body_style))
    
    # Summary Table Box
    summary_data = [
        [Paragraph("Security Parameter", bold_body_style), Paragraph("Current Value", bold_body_style), Paragraph("Evaluation", bold_body_style)],
        ["Hospital Devices Tracked", str(len(devices)), "Baseline Active Layout"],
        ["Active AI Threat Warnings", str(attack_count), "Requires Immediate Isolation" if attack_count > 0 else "Normal System State"],
        ["Blockchain Ledger Audit", blockchain_status, "Verified Integrity" if audit_results["status"] == "Valid" else "SECURITY ALERT: Records Tampered!"],
    ]
    summary_table = Table(summary_data, colWidths=[180, 120, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('TEXTCOLOR', (0, 2), (1, 2), colors.red if attack_count > 0 else colors.black),
        ('TEXTCOLOR', (1, 3), (1, 3), colors.green if audit_results["status"] == "Valid" else colors.red),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    # --- Section 2: Device Infrastructure Assessment ---
    story.append(Paragraph("2. Departmental IoMT Device Audit", heading2_style))
    story.append(Paragraph("Below is the risk-assessment catalog for smart medical equipment by department:", body_style))
    
    device_data = [
        [Paragraph("Device ID", bold_body_style), Paragraph("Name", bold_body_style), Paragraph("Room / Department", bold_body_style), Paragraph("Status", bold_body_style), Paragraph("Risk Score", bold_body_style)]
    ]
    for dev in devices:
        status_color = colors.green
        if dev['status'] == 'Under Attack':
            status_color = colors.red
        elif dev['status'] == 'Offline':
            status_color = colors.gray
        elif dev['status'] == 'Maintenance':
            status_color = colors.orange
            
        device_data.append([
            dev['id'],
            dev['name'],
            dev['room'],
            Paragraph(f"<font color='{status_color.hexval()}'><b>{dev['status']}</b></font>", body_style),
            f"{dev['risk_score']}%"
        ])
    
    device_table = Table(device_data, colWidths=[90, 130, 120, 90, 70])
    device_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E2E8F0')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(device_table)
    
    story.append(PageBreak()) # Move to next page for alert details
    
    # --- Section 3: AI Threat History ---
    story.append(Paragraph("3. AI Threat History logs", heading2_style))
    if not alerts:
        story.append(Paragraph("No critical cybersecurity threats or device anomalies have been flagged by the Machine Learning module in the current logging cycle.", body_style))
    else:
        story.append(Paragraph("The Machine Learning Random Forest classifier flagged the following security anomalies:", body_style))
        alert_data = [
            [Paragraph("Timestamp", bold_body_style), Paragraph("Device ID", bold_body_style), Paragraph("Severity", bold_body_style), Paragraph("Alert Message Description", bold_body_style)]
        ]
        for alert in alerts:
            sev_color = colors.red if alert['severity'] in ('Critical', 'High') else colors.orange
            alert_data.append([
                alert['timestamp'],
                alert['device_id'] if alert['device_id'] else "SYSTEM",
                Paragraph(f"<font color='{sev_color.hexval()}'><b>{alert['severity']}</b></font>", body_style),
                Paragraph(alert['message'], body_style)
            ])
        alert_table = Table(alert_data, colWidths=[100, 80, 70, 250])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F87171')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EF4444')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#FEF2F2')]),
        ]))
        story.append(alert_table)
        
    story.append(Spacer(1, 15))
    
    # --- Section 4: Forensic & Cyber Security Recommendations ---
    story.append(Paragraph("4. Recommended Mitigation Strategies", heading2_style))
    recs = [
        "<b>1. Departmental Network Segmentation:</b> Isolate clinical IoMT devices (ICU, Operation Theatre) from standard hospital WiFi networks. Apply firewalls restricting inter-departmental traffic.",
        "<b>2. Machine Learning Pipeline updates:</b> Regularly update baseline dataset inputs in the <i>train.py</i> pipeline to prevent ML classification drift on newer Botnet signatures.",
        "<b>3. Cryptographic Ledger Backup:</b> In case of 'TAMPERED' warnings, cross-reference the digital signatures (SIG_Admin, SIG_Analyst) stored inside the database with the secure cold backup logs.",
        "<b>4. Firmware Patching:</b> Instantly isolate and patch firmware on devices indicating elevated risk scores (> 40%) to eliminate buffer overflows or protocol exploits."
    ]
    for rec in recs:
        story.append(Paragraph(rec, body_style))
        story.append(Spacer(1, 4))
        
    # Build Document
    doc.build(story)
    print(f"Forensic PDF report generated at {output_path}")
    return output_path

if __name__ == "__main__":
    test_pdf = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_report.pdf"))
    generate_security_report(test_pdf, "System Test Auditor")
