import com.boolint.acqtax.Utils;
import com.boolint.acqtax.vo.AcqTaxVo;
import java.util.Random;

// AcqTax 의 실제 Utils.java 를 그대로 컴파일해 입력 격자와 결과 비트를 출력한다 → acqtax-parity.js 가 비교
// 출력: kind reason pQty rQty jojung corp gungmin price junggwa \t chi ji nong total(=HouseActivity 합계 금액) 비트
public class AcqTaxParity {
    public static void main(String[] a) {
        String[] reasons = {"매매", "상속", "원시", "증여", "기타"};
        double[] edges = {0, 1, 99999999, 100000000, 100000001, 199999999, 200000000, 299999999, 300000000,
                          599999999, 600000000, 600000001, 650000000, 700000000, 750000000, 800000000, 850000000, 899999999, 900000000, 900000001, 3000000000.0};
        Random rnd = new Random(20261027L);
        StringBuilder sb = new StringBuilder();
        int n = 0;
        for (String r : reasons) for (int p = 1; p <= 4; p++) for (int q = 1; q <= 4; q++)
            for (int f = 0; f < 16; f++) {
                boolean jo = (f & 1) != 0, corp = (f & 2) != 0, gm = (f & 4) != 0, ex = (f & 8) != 0;
                for (double price : edges) { house(sb, r, p, q, jo, corp, gm, price, ex); n++; }
                for (int i = 0; i < 4; i++) {   // 6~9억 구간 식(2/3 × 억 − 3 → 소수 2자리 반올림)은 무작위로 많이
                    double price = 600000000 + rnd.nextInt(300000001);
                    house(sb, r, p, q, jo, corp, gm, price, ex); n++;
                }
            }
        for (String r : reasons) { AcqTaxVo v = Utils.getAcqTaxRateEtc(r); out(sb, "etc|" + r, v, 0); n++; }
        // 실거래 분포 무작위(만원 단위 금액 × 10000) — 1주택 매매, 85㎡ 초과 여부
        for (int i = 0; i < 6000; i++) {
            double price = (double) (rnd.nextInt(500000) + 1) * 10000;
            boolean gm = rnd.nextBoolean();
            house(sb, "매매", 1, 1, false, false, gm, price, false); n++;
        }
        System.out.print(sb);
        System.err.println("cases " + n);
    }
    static void house(StringBuilder sb, String r, int p, int q, boolean jo, boolean corp, boolean gm, double price, boolean ex) {
        AcqTaxVo v = Utils.getAcqTaxRateHouse(r, p, q, jo, corp, gm, price, ex);
        out(sb, "house|" + r + "|" + p + "|" + q + "|" + jo + "|" + corp + "|" + gm + "|" + Double.doubleToLongBits(price) + "|" + ex, v, price);
    }
    static void out(StringBuilder sb, String key, AcqTaxVo v, double price) {
        double tot = v.chiTaxRate + v.nongTaxRate + v.jiTaxRate;
        sb.append(key).append('\t').append(Double.doubleToLongBits(v.chiTaxRate)).append('\t').append(Double.doubleToLongBits(v.jiTaxRate))
          .append('\t').append(Double.doubleToLongBits(v.nongTaxRate)).append('\t').append(Double.doubleToLongBits(tot * price / 100.0)).append('\n');
    }
}
