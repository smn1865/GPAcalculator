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
/**
 * Calculates the Module MOG, Module Need, and Module Result.
 */
function updateBlocCalculation(blocBody) {
    const rows = blocBody.querySelectorAll('tr[data-subject-id]');
    let totalWeightedGradeCompleted = 0;
    let countedEcts = 0;   // ECTS that must be completed for the bloc (excludes unused electives)
    let completedEcts = 0; // ECTS for subjects with full grades

    // --- New variables for "Module Need" (bloc target MOG = TARGET_MOG) ---
    let totalMidtermContribution = 0;        // Σ (ECTS_i * midtermWeight_i * midterm_i)
    let totalFinalContributionKnown = 0;     // Σ (ECTS_i * finalWeight_i * final_i) for already-entered finals
    let totalFinalWeightEctsMissing = 0;     // Σ (ECTS_i * finalWeight_i) for finals that are still empty
    let canComputeModuleNeed = true;         // becomes false if some needed midterm is missing

    rows.forEach(row => {
        const ectsCell = row.querySelector('.ects');
        const gpaCell = row.querySelector('.gpa');
        const finalInput = row.querySelector('.final');
        const midtermInput = row.querySelector('.midterm');

        const ects = parseFloat(ectsCell.textContent);

        if (!isNaN(ects) && ects > 0) {

            // Check if the subject is actively being counted (i.e., not a disabled elective)
            const isCountedSubject = !midtermInput.disabled;

            if (isCountedSubject) {
                countedEcts += ects;

                const midVal = parseFloat(midtermInput.value);
                const finVal = parseFloat(finalInput.value);
                const weights = getWeightsFromRow(row);

                // --- Collect contributions for Module Need ---

                // Midterms contribute only if their weight > 0
                if (weights.midterm > 0) {
                    if (isNaN(midVal)) {
                        // We cannot correctly compute module need if a required midterm is missing
                        canComputeModuleNeed = false;
                    } else {
                        totalMidtermContribution += ects * weights.midterm * midVal;
                    }
                }

                // Finals: known vs missing
                if (!isNaN(finVal)) {
                    totalFinalContributionKnown += ects * weights.final * finVal;
                } else if (weights.final > 0) {
                    // This final is still empty, so it will share the same required K
                    totalFinalWeightEctsMissing += ects * weights.final;
                }

                // --- Existing logic for current MOG calculation ---
                const isCompleted = !isNaN(midVal) && !isNaN(finVal);
                const grade = parseFloat(gpaCell.textContent); // subject GPA already computed

                if (isCompleted && !isNaN(grade)) {
                    totalWeightedGradeCompleted += grade * ects;
                    completedEcts += ects;
                } else {
                    // This assumes incompleteSubjects is defined elsewhere in your code
                    if (typeof incompleteSubjects !== 'undefined') {
                        incompleteSubjects.push({ row: row, ects: ects });
                    }
                }
            }
        }
    });

    // --- New Part: Module Need (bloc-level target MOG = TARGET_MOG) ---
    const moduleNeedCells = blocBody.querySelectorAll('.mogneed');
    let moduleNeedText = '\u2014';

    if (countedEcts > 0 && canComputeModuleNeed) {
        // Total grade "mass" we must have for MOG = TARGET_MOG
        const requiredTotalGrade = TARGET_MOG * countedEcts;

        // Current contribution from midterms and already-known finals
        const currentContribution = totalMidtermContribution + totalFinalContributionKnown;

        // How much the *remaining* finals must still contribute
        const remainingContribution = requiredTotalGrade - currentContribution;

        if (totalFinalWeightEctsMissing > 0) {
            // Assume the same final K for all remaining finals:
            //   K * Σ(ECTS_i * finalWeight_i) = remainingContribution
            const requiredFinalAvg = remainingContribution / totalFinalWeightEctsMissing;

            if (!isFinite(requiredFinalAvg)) {
                moduleNeedText = 'Impossible';
            } else if (requiredFinalAvg <= 0) {
                // Even with 0 on all remaining finals, MOG would be >= TARGET_MOG
                moduleNeedText = '0.0';
            } else if (requiredFinalAvg > 20) {
                // Can't reach the target with max finals = 20
                moduleNeedText = 'Impossible';
            } else {
                moduleNeedText = `Need ${requiredFinalAvg.toFixed(2)}`;
            }
        } else {
            // No finals left to adjust (all finals known or their weight is 0)
            const achievedMogIfFrozen = currentContribution / countedEcts;
            if (achievedMogIfFrozen >= TARGET_MOG) {
                moduleNeedText = '0.0';       // already ≥ 10, nothing more needed
            } else {
                moduleNeedText = 'Impossible'; // nothing left to change to reach 10
            }
        }
    }

    // Write the same module need text in every .mogneed cell of this bloc
    moduleNeedCells.forEach(cell => {
        cell.textContent = moduleNeedText;
    });

    // --- Part 1: Current MOG Calculation (unchanged, except using our accumulators) ---
    const mogCell = blocBody.querySelector('.mog');
    const resultCell = blocBody.querySelector('.result');

    let currentMog = 0;

    if (completedEcts > 0) {
        currentMog = totalWeightedGradeCompleted / completedEcts;
        mogCell.textContent = currentMog.toFixed(2);
    } else {
        mogCell.textContent = '\u2014';
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


// --- Overall GPA Calculation ---

/**
 * Calculates the overall semester GPA and writes it into the summary cell.
 */
function updateOverallGPA() {
    const blocBodies = document.querySelectorAll('.bloc');
    const overallGpaElement = document.getElementById('overall-gpa');

    if (!overallGpaElement || blocBodies.length === 0) {
        return;
    }

    let totalWeightedMog = 0;
    let totalEctsCounted = 0;
    let totalEctsCompleted = 0;
    let isAnyBlocNonValide = false;

    blocBodies.forEach(blocBody => {
        const rows = blocBody.querySelectorAll('tr[data-subject-id]');
        const mogCell = blocBody.querySelector('.mog');
        const resultCell = blocBody.querySelector('.result');
        const mogText = mogCell ? mogCell.textContent : '';
        const resultText = resultCell ? resultCell.textContent.trim() : '';

        const mog = parseFloat(mogText);
        let blocEcts = 0;
        let blocCompletedEcts = 0;

        rows.forEach(row => {
            const ects = parseFloat(row.querySelector('.ects').textContent);
            const midtermInput = row.querySelector('.midterm');
            const finalInput = row.querySelector('.final');

            if (!midtermInput || !finalInput) return;

            if (!midtermInput.disabled && !isNaN(ects) && ects > 0) {
                blocEcts += ects;

                const hasMidterm = !isNaN(parseFloat(midtermInput.value));
                const hasFinal = !isNaN(parseFloat(finalInput.value));
                if (hasMidterm && hasFinal) {
                    blocCompletedEcts += ects;
                }
            }
        });

        totalEctsCounted += blocEcts;

        if ((resultText === 'Validé' || resultText === 'Non Validé') && blocEcts > 0 && !isNaN(mog)) {
            totalWeightedMog += mog * blocEcts;
            totalEctsCompleted += blocEcts;

            if (resultText === 'Non Validé') {
                isAnyBlocNonValide = true;
            }
        }
    });

    if (totalEctsCounted === 0) {
        overallGpaElement.textContent = '\u2014';
        overallGpaElement.style.color = '#222222';
        return;
    }

    if (totalEctsCompleted === totalEctsCounted && totalEctsCompleted > 0) {
        if (isAnyBlocNonValide) {
            overallGpaElement.textContent = 'Non Validé';
            overallGpaElement.style.color = '#c3202c';
        } else {
            const overallGpa = totalWeightedMog / totalEctsCompleted;
            overallGpaElement.textContent = overallGpa.toFixed(2);
            overallGpaElement.style.color = overallGpa >= TARGET_MOG ? '#0a8a0a' : '#c3202c';
        }
        return;
    }

    if (totalEctsCompleted > 0) {
        const partialGpa = totalWeightedMog / totalEctsCompleted;
        overallGpaElement.textContent = `${partialGpa.toFixed(2)} (${totalEctsCompleted}/${totalEctsCounted} ECTS)`;
        overallGpaElement.style.color = '#cc8800';
    } else {
        overallGpaElement.textContent = 'In Progress';
        overallGpaElement.style.color = '#666666';
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
