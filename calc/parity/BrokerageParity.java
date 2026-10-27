import com.boolint.realestatecal.helper.CalHelper;
import java.util.Random;

// RealEstateCal 의 실제 CalHelper.java 를 그대로 컴파일해 입력 격자와 결과 비트를 출력한다 → parity.js 가 같은 입력을 JS 로 돌려 비교
// 출력: 물건 \t 거래 \t price1 \t price2 \t doubleToLongBits(calFee)
public class BrokerageParity {
    public static void main(String[] a) {
        String[] objs = {"주택", "오피스텔", "그외"};
        String[] trades = {"매매", "전세", "월세"};
        int[] edges = {0, 1, 4999, 5000, 5001, 9999, 10000, 19999, 20000, 59999, 60000, 89999, 90000, 119999, 120000, 149999, 150000, 150001, 999999};
        Random rnd = new Random(20261027L);
        StringBuilder sb = new StringBuilder();
        int n = 0;
        for (String o : objs) for (String t : trades) {
            // 구간 경계 — 월세는 보증금·월세 조합으로 환산 경계(5천만)를 지나게
            for (int p : edges) for (int r : (t.equals("월세") ? new int[]{0, 1, 10, 49, 50, 70, 100, 300, 1000} : new int[]{0})) { line(sb, o, t, p, r); n++; }
            // 무작위 — 실거래 분포를 흉내(매매 ~50억, 전세 ~30억, 월세 보증금 ~5억·월세 ~1,500만)
            int k = 12000 / 9;
            for (int i = 0; i < k; i++) {
                int p1 = t.equals("월세") ? rnd.nextInt(50000) : rnd.nextInt(t.equals("매매") ? 500000 : 300000);
                int p2 = t.equals("월세") ? rnd.nextInt(1500) : 0;
                line(sb, o, t, p1, p2); n++;
            }
        }
        System.out.print(sb);
        System.err.println("cases " + n);
    }
    static void line(StringBuilder sb, String o, String t, int p1, int p2) {
        double f = CalHelper.calFee("서울", o, t, p1, p2);
        sb.append(o).append('\t').append(t).append('\t').append(p1).append('\t').append(p2).append('\t').append(Double.doubleToLongBits(f)).append('\n');
    }
}
