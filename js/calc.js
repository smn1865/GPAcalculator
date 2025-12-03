// --- Configuration: Targets ---
const TARGET_PASSING_GRADE = 10.0; 
// Removed TARGET_MOG constant as it is now determined by input or TARGET_PASSING_GRADE

// --- Helper Functions ---

function clampGrade(value) {
    if (isNaN(value)) return 0;
    return Math.min(20, Math.max(0, value));
}

function getWeightsFromRow(row) {
    const defaultWeights = { midterm: 0.4, final: 0.6 };
    
    // Check for Sem 1 data attributes
    let midtermWeight = parseFloat(row.dataset.midtermWeight);
    let finalWeight = parseFloat(row.dataset.finalWeight);
    
    // If Sem 1 attributes are missing, try Sem 2 attributes
    if (isNaN(midtermWeight) || isNaN(finalWeight)) {
        // These lines are redundant but safe, kept for clarity 
        midtermWeight = parseFloat(row.dataset.midtermWeight); 
        finalWeight = parseFloat(row.dataset.finalWeight); 
    }
    
    if (isNaN(midtermWeight) || isNaN(finalWeight)) {
        return defaultWeights;
    }

    return { midterm: midtermWeight, final: finalWeight };
}

function calculateWeightedAverage(midterm, final, weights) {
    return (midterm * weights.midterm) + (final * weights.final);
}

/**
 * Calculates the final score required to reach a specific target grade for a single subject.
 * @param {number} midterm - The midterm score.
 * @param {object} weights - The midterm and final weights.
 * @param {number} targetGrade - The desired overall grade (0-20).
 * @returns {number} The required final score.
 */
function calculateRequiredFinalScore(midterm, weights, targetGrade) {
    // Use the provided targetGrade, or fall back to TARGET_PASSING_GRADE (10.0)
    const finalTarget = (isNaN(targetGrade) || targetGrade < 0 || targetGrade > 20) 
        ? TARGET_PASSING_GRADE 
        : targetGrade;
        
    const requiredContribution = finalTarget - (midterm * weights.midterm);
    
    if (weights.final === 0) return 21; 
    
    const requiredFinal = requiredContribution / weights.final;
    
    return requiredFinal;
}

function handleBloc4Electives() {
    // SEMESTER 1 Electives
    const spanishRow = document.querySelector('tr[data-subject-id="spanish"]');
    const germanRow = document.querySelector('tr[data-subject-id="german"]');

    if (spanishRow && germanRow) {
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
    
    // SEMESTER 2 Electives
    const spanishRow2 = document.querySelector('tr[data-subject2-id="spanish2"]');
    const germanRow2 = document.querySelector('tr[data-subject2-id="german2"]');

    if (spanishRow2 && germanRow2) {
        const spanishMidterm2 = spanishRow2.querySelector('.midterm');
        const spanishFinal2 = spanishRow2.querySelector('.final');
        const germanMidterm2 = germanRow2.querySelector('.midterm');
        const germanFinal2 = germanRow2.querySelector('.final');

        const isSpanishFilled2 = (spanishMidterm2.value.trim() !== '' || spanishFinal2.value.trim() !== '');
        const isGermanFilled2 = (germanMidterm2.value.trim() !== '' || germanFinal2.value.trim() !== '');

        if (isSpanishFilled2 && !isGermanFilled2) {
            germanMidterm2.disabled = true;
            germanFinal2.disabled = true;
            germanMidterm2.value = '';
            germanFinal2.value = '';
        } else if (isGermanFilled2 && !isSpanishFilled2) {
            spanishMidterm2.disabled = true;
            spanishFinal2.disabled = true;
            spanishMidterm2.value = '';
            spanishFinal2.value = '';
        } else if (!isSpanishFilled2 && !isGermanFilled2) {
            spanishMidterm2.disabled = false;
            spanishFinal2.disabled = false;
            germanMidterm2.disabled = false;
            germanFinal2.disabled = false;
        }
    }
}


// --- Main Calculation Functions ---

function updateSubjectCalculation(row) {
    // Handle electives for both semesters
    if (row.closest('.bloc.bloc-4') || row.closest('.bloc2.bloc2-4')) {
        handleBloc4Electives();
    }
    
    const midtermInput = row.querySelector('.midterm');
    const finalInput = row.querySelector('.final');
    const prefFinalInput = row.querySelector('.prefered-final'); 
    const avgCell = row.querySelector('.avg'); 
    const gpaCell = row.querySelector('.gpa'); 

    const weights = getWeightsFromRow(row); 
    
    let midterm = parseFloat(midtermInput.value);
    let final = parseFloat(finalInput.value);
    let preferredGrade = parseFloat(prefFinalInput ? prefFinalInput.value : undefined); 

    // Validation/Clamping for all inputs
    if (!isNaN(midterm)) {
        midterm = clampGrade(midterm);
        midtermInput.value = midterm; 
    }
    if (!isNaN(final)) {
        final = clampGrade(final);
        finalInput.value = final; 
    }
    if (prefFinalInput && !isNaN(preferredGrade)) {
        preferredGrade = clampGrade(preferredGrade);
        prefFinalInput.value = preferredGrade;
    } else {
        // If preferred grade is empty or invalid, default to the passing grade (10.0)
        preferredGrade = TARGET_PASSING_GRADE; 
    }

    // --- Subject Need Calculation ---
    if (!isNaN(midterm)) {
        const requiredFinal = calculateRequiredFinalScore(midterm, weights, preferredGrade);
        
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

    // --- Subject GPA Calculation ---
    if (isNaN(midterm) || isNaN(final)) {
        gpaCell.textContent = '\u2014';
    } else {
        const weightedAvg = calculateWeightedAverage(midterm, final, weights);
        gpaCell.textContent = weightedAvg.toFixed(2);
    }
    
    // Trigger block calculation
    const blocBody = row.closest('.bloc') || row.closest('.bloc2'); 
    if (blocBody) {
        if (blocBody.classList.contains('bloc')) {
            updateBlocCalculation(blocBody); // Calls Sem 1 bloc calculation
        } else if (blocBody.classList.contains('bloc2')) {
            updateBlocCalculation2(blocBody); // Calls Sem 2 bloc calculation
        }
    }
}


/**
 * Calculates the Module MOG, Module Need, and Module Result for SEMESTER 1 blocks.
 */
function updateBlocCalculation(blocBody) {
    const rows = blocBody.querySelectorAll('tr[data-subject-id]');
    const prefBlockInput = blocBody.querySelector('.pref-block-gpa');

    let totalWeightedGradeCompleted = 0;
    let countedEcts = 0; 
    let completedEcts = 0;

    let totalMidtermContribution = 0; 
    let totalFinalContributionKnown = 0; 
    let totalFinalWeightEctsMissing = 0;
    let canComputeModuleNeed = true; 
    
    // Determine target MOG
    let targetMOG = parseFloat(prefBlockInput.value);
    if (isNaN(targetMOG) || targetMOG < 0 || targetMOG > 20) {
        targetMOG = TARGET_PASSING_GRADE;
    }

    rows.forEach(row => {
        const ectsCell = row.querySelector('.ects');
        const gpaCell = row.querySelector('.gpa');
        const finalInput = row.querySelector('.final');
        const midtermInput = row.querySelector('.midterm');

        const ects = parseFloat(ectsCell.textContent);

        if (!isNaN(ects) && ects > 0) {
            const isCountedSubject = !midtermInput.disabled;

            if (isCountedSubject) {
                countedEcts += ects;

                const midVal = parseFloat(midtermInput.value);
                const finVal = parseFloat(finalInput.value);
                const weights = getWeightsFromRow(row);

                // --- Collect contributions for Module Need (using preferred targetMOG) ---
                // Contribution to the total grade = ECTS * (Midterm*W_midterm + Final*W_final)
                
                if (weights.midterm > 0) {
                    if (isNaN(midVal)) {
                        canComputeModuleNeed = false;
                    } else {
                        // Midterm Contribution * ECTS
                        totalMidtermContribution += ects * weights.midterm * midVal;
                    }
                }

                if (!isNaN(finVal)) {
                    // Known Final Contribution * ECTS
                    totalFinalContributionKnown += ects * weights.final * finVal;
                } else if (weights.final > 0) {
                    // Total weighting (W_final * ECTS) we need to average across to hit target
                    totalFinalWeightEctsMissing += ects * weights.final;
                }

                // --- Existing logic for current MOG calculation ---
                const isCompleted = !isNaN(midVal) && !isNaN(finVal);
                const grade = parseFloat(gpaCell.textContent);

                if (isCompleted && !isNaN(grade)) {
                    totalWeightedGradeCompleted += grade * ects;
                    blocCompletedEcts += ects; // Use a temp variable for ECTS completion check
                } 
            }
        }
    });
    
    completedEcts = blocBody.querySelector('.mog') ? blocCompletedEcts : 0; // Only for MOG calculation check

    // --- Part 1: Module Need (bloc-level target MOG) ---
    const moduleNeedCells = blocBody.querySelectorAll('.mogneed');
    let moduleNeedText = '\u2014';

    if (countedEcts > 0 && canComputeModuleNeed) {
        const requiredTotalContribution = targetMOG * countedEcts;
        const currentKnownContribution = totalMidtermContribution + totalFinalContributionKnown;
        const remainingContributionNeeded = requiredTotalContribution - currentKnownContribution;

        if (totalFinalWeightEctsMissing > 0) {
            // Required average final score = Remaining Contribution / Total Missing Final Weighting
            const requiredFinalAvg = remainingContributionNeeded / totalFinalWeightEctsMissing;

            if (!isFinite(requiredFinalAvg) || requiredFinalAvg > 20) {
                moduleNeedText = 'Impossible';
            } else if (requiredFinalAvg <= 0) {
                moduleNeedText = '0.0'; 
            } else {
                moduleNeedText = `Need Avg ${requiredFinalAvg.toFixed(2)}`;
            }
        } else {
            // All final scores are entered, check if current grade hits the target
            const achievedMogIfFrozen = currentKnownContribution / countedEcts;
            moduleNeedText = achievedMogIfFrozen >= targetMOG ? '0.0' : 'Impossible';
        }
    }

    moduleNeedCells.forEach(cell => {
        cell.textContent = moduleNeedText;
    });

    // --- Part 2: Current MOG Calculation ---
    const mogCell = blocBody.querySelector('.mog');
    const resultCell = blocBody.querySelector('.result');

    let currentMog = 0;
    let completedEctsForMog = 0; // Reset for actual MOG check

    // Recalculate completed ECTS by summing up completed subject ECTS
    rows.forEach(row => {
        const ects = parseFloat(row.querySelector('.ects').textContent);
        const midtermInput = row.querySelector('.midterm');
        const finalInput = row.querySelector('.final');
        if (!midtermInput.disabled && !isNaN(ects) && ects > 0) {
            const midVal = parseFloat(midtermInput.value);
            const finVal = parseFloat(finalInput.value);
            if (!isNaN(midVal) && !isNaN(finVal)) {
                completedEctsForMog += ects;
            }
        }
    });

    if (completedEctsForMog > 0) {
        currentMog = totalWeightedGradeCompleted / completedEctsForMog;
        mogCell.textContent = currentMog.toFixed(2);
    } else {
        mogCell.textContent = '\u2014';
    }

    // --- Part 3: Result Fix (Check against counted ECTS) ---
    if (countedEcts > 0) {
        if (completedEctsForMog === countedEcts) {
            resultCell.textContent = currentMog >= TARGET_PASSING_GRADE ? 'Validé' : 'Non Validé';
        } else {
            resultCell.textContent = 'In Progress';
        }
    } else {
        resultCell.textContent = '\u2014';
    }

    // Trigger the Overall GPA update for Semester 1
    updateOverallGPA();
}

/**
 * Calculates the Module MOG, Module Need, and Module Result for SEMESTER 2 blocks.
 */
function updateBlocCalculation2(blocBody) {
    const rows = blocBody.querySelectorAll('tr[data-subject2-id]');
    const prefBlockInput = blocBody.querySelector('.pref-block-gpa');

    let totalWeightedGradeCompleted = 0;
    let countedEcts = 0; 
    let completedEctsForMog = 0;

    let totalMidtermContribution = 0; 
    let totalFinalContributionKnown = 0; 
    let totalFinalWeightEctsMissing = 0;
    let canComputeModuleNeed = true; 
    
    // Determine target MOG
    let targetMOG = parseFloat(prefBlockInput.value);
    if (isNaN(targetMOG) || targetMOG < 0 || targetMOG > 20) {
        targetMOG = TARGET_PASSING_GRADE;
    }


    rows.forEach(row => {
        const ectsCell = row.querySelector('.ects');
        const gpaCell = row.querySelector('.gpa');
        const finalInput = row.querySelector('.final');
        const midtermInput = row.querySelector('.midterm');

        const ects = parseFloat(ectsCell.textContent);

        if (!isNaN(ects) && ects > 0) {

            const isCountedSubject = !midtermInput.disabled;

            if (isCountedSubject) {
                countedEcts += ects;

                const midVal = parseFloat(midtermInput.value);
                const finVal = parseFloat(finalInput.value);
                const weights = getWeightsFromRow(row);

                // --- Collect contributions for Module Need (using preferred targetMOG) ---
                if (weights.midterm > 0) {
                    if (isNaN(midVal)) {
                        canComputeModuleNeed = false;
                    } else {
                        totalMidtermContribution += ects * weights.midterm * midVal;
                    }
                }

                if (!isNaN(finVal)) {
                    totalFinalContributionKnown += ects * weights.final * finVal;
                } else if (weights.final > 0) {
                    totalFinalWeightEctsMissing += ects * weights.final;
                }

                // --- Existing logic for current MOG calculation ---
                const grade = parseFloat(gpaCell.textContent);

                if (!isNaN(midVal) && !isNaN(finVal) && !isNaN(grade)) {
                    totalWeightedGradeCompleted += grade * ects;
                    completedEctsForMog += ects;
                } 
            }
        }
    });

    // --- Part 1: Module Need (bloc-level target MOG) ---
    const moduleNeedCells = blocBody.querySelectorAll('.mogneed');
    let moduleNeedText = '\u2014';

    if (countedEcts > 0 && canComputeModuleNeed) {
        const requiredTotalContribution = targetMOG * countedEcts;
        const currentKnownContribution = totalMidtermContribution + totalFinalContributionKnown;
        const remainingContributionNeeded = requiredTotalContribution - currentKnownContribution;

        if (totalFinalWeightEctsMissing > 0) {
            // Required average final score = Remaining Contribution / Total Missing Final Weighting
            const requiredFinalAvg = remainingContributionNeeded / totalFinalWeightEctsMissing;

            if (!isFinite(requiredFinalAvg) || requiredFinalAvg > 20) {
                moduleNeedText = 'Impossible';
            } else if (requiredFinalAvg <= 0) {
                moduleNeedText = '0.0'; 
            } else {
                moduleNeedText = `Need Avg ${requiredFinalAvg.toFixed(2)}`;
            }
        } else {
            // All final scores are entered, check if current grade hits the target
            const achievedMogIfFrozen = currentKnownContribution / countedEcts;
            moduleNeedText = achievedMogIfFrozen >= targetMOG ? '0.0' : 'Impossible';
        }
    }

    moduleNeedCells.forEach(cell => {
        cell.textContent = moduleNeedText;
    });

    // --- Part 2: Current MOG Calculation ---
    const mogCell = blocBody.querySelector('.mog');
    const resultCell = blocBody.querySelector('.result');

    let currentMog = 0;

    if (completedEctsForMog > 0) {
        currentMog = totalWeightedGradeCompleted / completedEctsForMog;
        mogCell.textContent = currentMog.toFixed(2);
    } else {
        mogCell.textContent = '\u2014';
    }

    // --- Part 3: Result Fix (Check against counted ECTS) ---
    if (countedEcts > 0) {
        if (completedEctsForMog === countedEcts) {
            resultCell.textContent = currentMog >= TARGET_PASSING_GRADE ? 'Validé' : 'Non Validé';
        } else {
            resultCell.textContent = 'In Progress';
        }
    } else {
        resultCell.textContent = '\u2014';
    }

    // Trigger the Overall GPA update for Semester 2
    updateOverallGPA();
}


// --- Overall GPA Calculation ---

/**
 * Calculates the overall semester GPA and writes it into the summary cell.
 */
function updateOverallGPA() {
    const blocBodies = document.querySelectorAll('.bloc');
    const blocBodies2 = document.querySelectorAll('.bloc2');
    const overallGpaElement = document.getElementById('overall-gpa');
    const overallGpaElement2 = document.getElementById('overall-gpa-2');

    // Helper to calculate GPA for a set of blocks
    function calculateGPA(bodies, gpaElement) {
        if (!gpaElement || bodies.length === 0) {
            // Note: Returning early if the element isn't found or no blocks exist
            return;
        }

        let totalWeightedMog = 0;
        let totalEctsCounted = 0;
        let totalEctsCompleted = 0;
        let isAnyBlocNonValide = false;
        // Determine the correct data attribute based on the block type
        let dataSubjectAttr = bodies[0].classList.contains('bloc') ? 'data-subject-id' : 'data-subject2-id';

        bodies.forEach(blocBody => {
            const rows = blocBody.querySelectorAll(`tr[${dataSubjectAttr}]`);
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

            // Use the ECTS from the actual grade calculation (completed ECTS)
            if (blocCompletedEcts === blocEcts && blocEcts > 0 && !isNaN(mog)) {
                totalWeightedMog += mog * blocEcts;
                totalEctsCompleted += blocEcts;

                if (resultText === 'Non Validé') {
                    isAnyBlocNonValide = true;
                }
            }
        });

        if (totalEctsCounted === 0) {
            gpaElement.textContent = '\u2014';
            gpaElement.style.color = '#222222';
            return;
        }

        if (totalEctsCompleted === totalEctsCounted && totalEctsCompleted > 0) {
            if (isAnyBlocNonValide) {
                gpaElement.textContent = 'Non Validé';
                gpaElement.style.color = '#c32026';
            } else {
                const finalGPA = totalWeightedMog / totalEctsCompleted;
                gpaElement.textContent = finalGPA.toFixed(2);
                gpaElement.style.color = finalGPA >= TARGET_PASSING_GRADE ? '#317f43' : '#c32026';
            }
        } else {
            gpaElement.textContent = 'In Progress';
            gpaElement.style.color = '#ff9900';
        }
    }

    // Calculate for Semester 1
    calculateGPA(blocBodies, overallGpaElement);

    // Calculate for Semester 2
    calculateGPA(blocBodies2, overallGpaElement2);
}


// --- Event Listeners and Initial Setup ---

function initializeListeners() {
    // Select all inputs that trigger a calculation, including the new .prefered-final
    const inputSelectors = '.midterm, .final, .prefered-final, .pref-block-gpa';
    
    // Select all inputs across both semesters
    const allInputs = document.querySelectorAll(inputSelectors);

    allInputs.forEach(input => {
        // Find the closest row (which contains the subject data)
        const row = input.closest('tr');
        if (row) {
            input.addEventListener('input', () => {
                updateSubjectCalculation(row);
            });
        }
        
        // Block GPA input handling (explicitly trigger block calculation when Block Preferred Grade is changed)
        if (input.classList.contains('pref-block-gpa')) {
             input.addEventListener('input', () => {
                const blocBody = input.closest('.bloc') || input.closest('.bloc2');
                 if (blocBody) {
                    // Re-run block calculation when pref-block-gpa is changed
                    if (blocBody.classList.contains('bloc')) {
                        updateBlocCalculation(blocBody); 
                    } else if (blocBody.classList.contains('bloc2')) {
                        updateBlocCalculation2(blocBody); 
                    }
                 }
             });
        }
    });
}

// Initial calculation on load
window.addEventListener('load', () => {
    initializeListeners();

    // Trigger initial calculation for all subjects and blocks in both semesters
    const allRows = document.querySelectorAll('tbody tr[data-subject-id], tbody tr[data-subject2-id]');
    allRows.forEach(row => {
        updateSubjectCalculation(row); 
    });
    
    // An explicit call to overall GPA update is needed after all blocks are processed
    updateOverallGPA();
});