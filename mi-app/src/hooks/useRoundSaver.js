import supabase from '../supabaseClient';

/**
 * Hook para guardar datos de cada ronda:
 * - Subida de CSV de eye-tracking a Storage
 * - Insert en tabla `round_data`
 */
export function useRoundSaver(testId) {
  const saveRoundData = async ({
    roundIndex,
    positions,
    eyeTrackingData,
    roundStartTime
  }) => {
    // 1. Montar CSV de esta ronda
    const header = 'x,y,t\n';
    const body = eyeTrackingData
      .filter(d => d.t >= roundStartTime)
      .map(d => `${d.x},${d.y},${d.t}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const filePath = `${testId}/round_${roundIndex + 1}.csv`;

    // 2. Subir al bucket privado 'eye-tracking-csvs'
    const { error: uploadError } = await supabase.storage
      .from('eye-tracking-csvs')
      .upload(filePath, blob, {
        contentType: 'text/csv',
        upsert: true
      });
    if (uploadError) throw uploadError;

    // 3. Insertar metadata en `round_data`
    const { error: dbError } = await supabase
      .from('round_data')
      .insert({
        test_id: testId,
        round_number: roundIndex + 1,
        positions,
        eye_csv_path: filePath
      });
    if (dbError) throw dbError;
  };

  return { saveRoundData };
}