// --- Configuration: Targets ---
const TARGET_PASSING_GRADE = 10.0; 
const TARGET_MOG = 10.0; 

// --- Helper Functions (No changes here, relying on previous valid logic) ---

function clampGrade(value) {
    if (isNaN(value)) return 0;
    return Math.min(20, Math.max(0, value));
}

function getWeightsFromRow(row) {
    const defaultWeights = { midterm: 0.4, final: 0.6 };
    
    const midtermWeight = parseFloat(row.dataset.midtermWeight);
    const finalWeight = parseFloat(row.dataset.finalWeight);
    
    if (isNaN(midtermWeight) || isNaN(finalWeight)) {
        return defaultWeights;
    }

    return { midterm: midtermWeight, final: finalWeight };
}

function calculateWeightedAverage(midterm, final, weights) {
    return (midterm * weights.midterm) + (final * weights.final);
}

function calculateRequiredFinalScore(midterm, weights) {
    const requiredContribution = TARGET_PASSING_GRADE - (midterm * weights.midterm);
    
    if (weights.final === 0) return 21; 
    
    const requiredFinal = requiredContribution / weights.final;
    
    return requiredFinal;
}

function handleBloc4Electives() {
    const spanishRow = document.querySelector('tr[data-subject-id="spanish"]');
    const germanRow = document.querySelector('tr[data-subject-id="german"]');

    if (!spanishRow || !germanRow) return;

    const spanishMidterm = spanishRow.querySelector('.midterm');
    const spanishFinal = spanishRow.querySelector('.final');
    const germanMidterm = germanRow.querySelector('.midterm');
    const germanFinal = germanRow.querySelector('.final');
    
    const isSpanishFilled = (spanishMidterm.value.trim() !== '' || spanishFinal.value.trim() !== '');
    const isGermanFilled = (germanMidterm.value.trim() !== '' || germanFinal.value.trim() !== '');

    if (isSpanishFilled && !isGermanFilled) {
        germanMidterm.disabled = true;
        germanFinal.disabled = true;
        germanMidterm.value = '';
        germanFinal.value = '';
    } else if (isGermanFilled && !isSpanishFilled) {
        spanishMidterm.disabled = true;
        spanishFinal.disabled = true;
        spanishMidterm.value = '';
        spanishFinal.value = '';
    } else if (!isSpanishFilled && !isGermanFilled) {
        spanishMidterm.disabled = false;
        spanishFinal.disabled = false;
        germanMidterm.disabled = false;
        germanFinal.disabled = false;
    }
}


// --- Main Calculation Functions ---

function updateSubjectCalculation(row) {
    if (row.closest('.bloc.bloc-4')) {
        handleBloc4Electives();
    }
    
    const midtermInput = row.querySelector('.midterm');
    const finalInput = row.querySelector('.final');
    const avgCell = row.querySelector('.avg'); 
    const gpaCell = row.querySelector('.gpa'); 

    const weights = getWeightsFromRow(row); 
    
    let midterm = parseFloat(midtermInput.value);
    let final = parseFloat(finalInput.value);
    
    if (!isNaN(midterm)) {
        midterm = clampGrade(midterm);
        midtermInput.value = midterm; 
    }
    if (!isNaN(final)) {
        final = clampGrade(final);
        finalInput.value = final; 
    }

    if (!isNaN(midterm)) {
        const requiredFinal = calculateRequiredFinalScore(midterm, weights);
        
        if (requiredFinal <= 0) {
            avgCell.textContent = '0.0'; 
        } else if (requiredFinal > 20) {
            avgCell.textContent = 'Impossible';
        } else {
            avgCell.textContent = `Need ${requiredFinal.toFixed(2)}`;
        }
    } else {
        avgCell.textContent = '\u2014';
    }

    if (isNaN(midterm) || isNaN(final)) {
        gpaCell.textContent = '\u2014';
    } else {
        const weightedAvg = calculateWeightedAverage(midterm, final, weights);
        gpaCell.textContent = weightedAvg.toFixed(2);
    }
    
    const blocBody = row.closest('.bloc');
    if (blocBody) {
        updateBlocCalculation(blocBody);
    }
}


/**
 * Calculates the Module MOG, MOG Need, and Module Result.
 */
function updateBlocCalculation(blocBody) {
    const rows = blocBody.querySelectorAll('tr[data-subject-id]');
    let totalWeightedGradeCompleted = 0;
    let countedEcts = 0; // ECTS that must be completed for the bloc (excludes unused electives)
    let completedEcts = 0; // ECTS for subjects with full grades
    
    const incompleteSubjects = []; 

    rows.forEach(row => {
        const ectsCell = row.querySelector('.ects');
        const gpaCell = row.querySelector('.gpa'); 
        const finalInput = row.querySelector('.final');
        const midtermInput = row.querySelector('.midterm');

        const ects = parseFloat(ectsCell.textContent);
        
        if (!isNaN(ects) && ects > 0) {
            
            // Check if the subject is actively being counted (i.e., not a disabled elective)
            const isCountedSubject = !row.querySelector('.midterm').disabled;
            
            if (isCountedSubject) {
                countedEcts += ects;
                
                const isCompleted = !isNaN(parseFloat(midtermInput.value)) && !isNaN(parseFloat(finalInput.value));
                const grade = parseFloat(gpaCell.textContent); 

                if (isCompleted && !isNaN(grade)) {
                    totalWeightedGradeCompleted += grade * ects;
                    completedEcts += ects;
                } else {
                    incompleteSubjects.push({ row: row, ects: ects });
                }
            }
        }
    });

    // --- Part 1: Current MOG Calculation ---
    const mogCell = blocBody.querySelector('.mog');
    const resultCell = blocBody.querySelector('result');
    
    let currentMog = 0;
    
    if (completedEcts > 0) {
        currentMog = totalWeightedGradeCompleted / completedEcts;
        mogCell.textContent = currentMog.toFixed(2);
    } else {
        mogCell.textContent = '\u2014';
    }

    // --- Part 2: MOG Need Calculation ---
    const mogNeedCell = blocBody.querySelector('.mog-need');
    
    if (countedEcts === 0) {
        mogNeedCell.textContent = '\u2014';
    } else if (countedEcts === completedEcts) {
        mogNeedCell.textContent = 'All Done';
    } else {
        let hintOutput = '';
        const totalRemainingEcts = countedEcts - completedEcts;

        incompleteSubjects.forEach(subject => {
            const subjectEcts = subject.ects;
            const remainingEctsExcludingThisSubject = totalRemainingEcts - subjectEcts;
            
            const gradePointsFromOtherIncomplete = remainingEctsExcludingThisSubject * TARGET_PASSING_GRADE;
            const knownGradePoints = totalWeightedGradeCompleted + gradePointsFromOtherIncomplete;
            const requiredGradePointsFromSubject = (TARGET_MOG * countedEcts) - knownGradePoints; 
            const requiredAvgForSubject = requiredGradePointsFromSubject / subjectEcts;
            
            const subjectName = subject.row.querySelector('td:nth-child(2)').textContent.trim();

            if (requiredAvgForSubject <= 0) {
                hintOutput += `${subjectName}: 0.0\n`;
            } else if (requiredAvgForSubject > 20) {
                hintOutput += `${subjectName}: Impossible\n`;
            } else {
                hintOutput += `${subjectName}: Need ${requiredAvgForSubject.toFixed(2)}\n`;
            }
        });
        
        mogNeedCell.textContent = hintOutput.trim().replace(/\n/g, ' | ');
    }

    // --- Part 3: Result Fix (Check against counted ECTS) ---
    if (countedEcts > 0) {
        if (completedEcts === countedEcts) {
            // Module is fully complete, show final status
            resultCell.textContent = currentMog >= TARGET_MOG ? 'Validé' : 'Non Validé';
        } else {
            // Module is in progress, show intermediate status
            resultCell.textContent = 'In Progress';
        }
    } else {
        // Module has 0 ECTS or no active subjects (e.g., waiting for elective choice)
         resultCell.textContent = '\u2014';
    }
    
    // Trigger the Overall GPA update
    updateOverallGPA();
}


// --- Overall GPA Calculation Fix ---

/**
 * Calculates the Overall Semester GPA, weighted by the total ECTS of each module.
 */
function updateOverallGPA() {
    const blocBodies = document.querySelectorAll('.bloc');
    const overallGpaElement = document.getElementById('overall-gpa');
    
    let totalWeightedMog = 0;
    let totalEctsCounted = 0; // Total ECTS for all active subjects in the semester
    let totalEctsCompleted = 0; // ECTS from modules with full grades

    blocBodies.forEach(blocBody => {
        const rows = blocBody.querySelectorAll('tr[data-subject-id]');
        const mog = parseFloat(blocBody.querySelector('.mog').textContent);
        const result = blocBody.querySelector('.result').textContent;
        
        let currentBlocEcts = 0;
        let currentBlocCompletedEcts = 0;
        
        rows.forEach(row => {
            const ects = parseFloat(row.querySelector('.ects').textContent);
            const gpaCell = row.querySelector('.gpa'); 
            const finalInput = row.querySelector('.final');
            const midtermInput = row.querySelector('.midterm');
            
            if (!row.querySelector('.midterm').disabled && !isNaN(ects) && ects > 0) {
                 currentBlocEcts += ects; // ECTS of subjects currently being counted
                 
                 const isCompleted = !isNaN(parseFloat(midtermInput.value)) && !isNaN(parseFloat(finalInput.value));
                 if (isCompleted) {
                     currentBlocCompletedEcts += ects;
                 }
            }
        });
        
        // This is the total ECTS needed for this module to be considered complete
        totalEctsCounted += currentBlocEcts;

        if (result === 'Validé' || result === 'Non Validé') {
            // Module is fully complete and has a final MOG
            if (!isNaN(mog) && currentBlocEcts > 0) {
                totalWeightedMog += mog * currentBlocEcts;
                totalEctsCompleted += currentBlocEcts;
            }
        }
    });

    if (totalEctsCounted === 0) {
        overallGpaElement.textContent = '\u2014';
        return;
    }

    if (totalEctsCompleted === totalEctsCounted) {
        // ALL active subjects are fully complete
        const overallGpa = totalWeightedMog / totalEctsCompleted;
        overallGpaElement.textContent = overallGpa.toFixed(2);
        overallGpaElement.style.color = overallGpa >= TARGET_MOG ? 'green' : 'red';
    } else if (totalEctsCompleted > 0) {
        // Some subjects are complete, others are not (Incomplete Status)
        const overallGpaCurrent = totalWeightedMog / totalEctsCompleted; // Calculate current MOG based only on completed modules
        overallGpaElement.textContent = `${overallGpaCurrent.toFixed(2)} (${totalEctsCompleted}/${totalEctsCounted} ECTS complete)`;
        overallGpaElement.style.color = 'orange';
    } else {
        // Nothing is complete
        overallGpaElement.textContent = '\u2014';
        overallGpaElement.style.color = 'black';
    }
}


// --- Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    const gradeInputs = document.querySelectorAll('input.midterm, input.final');

    gradeInputs.forEach(input => {
        const row = input.closest('tr[data-subject-id]');
        if (row) {
            input.addEventListener('input', () => updateSubjectCalculation(row));
        }
    });
    
    // Initial runs
    // Note: We run updateSubjectCalculation first to set the individual grades/hints/etc.
    document.querySelectorAll('tr[data-subject-id]').forEach(row => updateSubjectCalculation(row));
    // Then we run updateBlocCalculation to get the Module MOGs and Results.
    document.querySelectorAll('.bloc').forEach(updateBlocCalculation);
    // Finally, run the Overall GPA update.
    updateOverallGPA();
});